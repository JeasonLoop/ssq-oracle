/**
 * 常规数学期望预测算法
 * 流程见 docs/DEV.md §1.3 A：频次 → 热温冷 → 遗漏 → 混合打分 → 分层抽样
 * 纯函数，无 UI 依赖
 */

import { randInt, sampleWithoutReplacement, weightedPick } from '../random.js';

/**
 * 统计窗口期内的红球频次与遗漏
 * @param {import('../types.js').SSQDraw[]} history 降序历史
 * @param {number} window 窗口期数
 * @returns {{freq: number[], missing: number[]}} 长度 34（索引 0 弃用）
 */
function redStats(history, window) {
  const draws = history.slice(0, window);
  const freq = new Array(34).fill(0);
  const missing = new Array(34).fill(window); // 默认整个窗口都没出现

  draws.forEach((draw, idx) => {
    draw.reds.forEach((n) => {
      freq[n] += 1;
      if (missing[n] === window) missing[n] = idx; // 第一次（最近）出现的位置即遗漏值
    });
  });
  return { freq, missing };
}

/**
 * 统计蓝球频次
 * @param {import('../types.js').SSQDraw[]} history
 * @param {number} window
 * @returns {number[]} 长度 17（索引 0 弃用）
 */
function blueStats(history, window) {
  const freq = new Array(17).fill(0);
  history.slice(0, window).forEach((d) => {
    freq[d.blue] += 1;
  });
  return freq;
}

/**
 * 生成一组号码
 * @param {import('../types.js').AlgoContext} ctx
 * @param {number} window 窗口期数
 * @returns {import('../types.js').SSQPick}
 */
function generateOne(ctx, window) {
  const { freq, missing } = redStats(ctx.history, window);
  const blueFreq = blueStats(ctx.history, window);
  const locks = ctx.locks;
  const excludes = ctx.excludes;

  // ---- 红球打分 ----
  const total = freq.reduce((s, f) => s + f, 0);
  const mean = total / 33;
  const std = Math.sqrt(
    freq.slice(1).reduce((s, f) => s + (f - mean) ** 2, 0) / 33
  );
  // 热温冷分层
  const tiers = { hot: [], warm: [], cold: [] };
  for (let n = 1; n <= 33; n++) {
    if (excludes.redExcludes.includes(n)) continue;
    const z = std > 0 ? (freq[n] - mean) / std : 0;
    if (z >= 0.75) tiers.hot.push(n);
    else if (z <= -0.75) tiers.cold.push(n);
    else tiers.warm.push(n);
  }
  // 锁定号已从候选池剔除（直接占位，不参与抽样）
  const isLocked = (n) => locks.redLocks.includes(n);
  Object.keys(tiers).forEach((k) => {
    tiers[k] = tiers[k].filter((n) => !isLocked(n));
  });

  // ---- 混合打分（频次 0.5 + 热度 0.3 + 遗漏回补 0.2）----
  const avgMissing =
    missing.slice(1).reduce((s, m) => s + m, 0) / 33;
  const redScore = (n) => {
    const freqNorm = freq[n] / Math.max(total, 1);
    const tierWeight =
      tiers.hot.includes(n) ? 1 : tiers.warm.includes(n) ? 0.6 : 0.3;
    // 遗漏超过均值 1.5 倍 → 「该回了」加分
    const dueBonus = missing[n] > avgMissing * 1.5 ? 0.2 : 0;
    return 0.5 * freqNorm + 0.3 * tierWeight + 0.2 * dueBonus;
  };

  // ---- 分层抽样：热 3±1、温 2±1、冷 1±1，总和 6-lockCount ----
  const need = 6 - locks.redLocks.length;
  const jitter = () => randInt(-1, 1); // 随机扰动避免结构雷同
  let hotN = Math.min(Math.max(3 + jitter(), 0), tiers.hot.length);
  let coldN = Math.min(Math.max(1 + jitter(), 0), tiers.cold.length);
  let warmN = need - hotN - coldN;
  // 温池兜底：若温池不够，从热冷补
  if (warmN > tiers.warm.length) {
    const over = warmN - tiers.warm.length;
    warmN = tiers.warm.length;
    const backToHot = Math.min(over, tiers.hot.length - hotN);
    hotN += backToHot;
    coldN = Math.min(need - hotN - warmN, tiers.cold.length);
  }

  const picked = [];
  const pickFrom = (pool, count) => {
    if (pool.length === 0 || count <= 0) return;
    // 池内按混合分加权抽取
    const weights = pool.map((n) => redScore(n) + 0.01); // +0.01 防 0 权重
    const chosen = [];
    const remain = [...pool];
    for (let i = 0; i < count && remain.length > 0; i++) {
      const w = remain.map((n) => redScore(n) + 0.01);
      const n = weightedPick(remain, w);
      chosen.push(n);
      remain.splice(remain.indexOf(n), 1);
    }
    picked.push(...chosen);
  };
  pickFrom(tiers.hot, hotN);
  pickFrom(tiers.warm, warmN);
  pickFrom(tiers.cold, coldN);

  // 兜底：若分层后仍不足 6 个（极端排除场景），从剩余全池随机补齐
  if (picked.length < need) {
    const restPool = [];
    for (let n = 1; n <= 33; n++) {
      if (
        !excludes.redExcludes.includes(n) &&
        !isLocked(n) &&
        !picked.includes(n)
      ) {
        restPool.push(n);
      }
    }
    picked.push(
      ...sampleWithoutReplacement(restPool, need - picked.length)
    );
  }

  const finalReds = [...locks.redLocks, ...picked].sort((a, b) => a - b);

  // ---- 蓝球 ----
  let blue;
  if (locks.blueLock !== null) {
    blue = locks.blueLock;
  } else {
    // Top 频次蓝球中随机取一
    const blueCandidates = [];
    for (let n = 1; n <= 16; n++) {
      if (!excludes.blueExcludes.includes(n)) blueCandidates.push(n);
    }
    const maxFreq = Math.max(...blueCandidates.map((n) => blueFreq[n]));
    const topBlue = blueCandidates.filter((n) => blueFreq[n] >= maxFreq - 1);
    blue = topBlue[randInt(0, topBlue.length - 1)];
  }

  return { reds: finalReds, blue };
}

/**
 * 数学期望算法入口
 * @param {import('../types.js').AlgoContext} ctx
 * @param {number} groupCount 1–5
 * @param {number} [window=30] 统计窗口期数
 * @returns {import('../types.js').AlgoResult}
 */
export function mathPredict(ctx, groupCount, window = 30) {
  const groups = [];
  for (let i = 0; i < groupCount; i++) {
    groups.push(generateOne(ctx, window));
  }
  return { groups, reading: null };
}
