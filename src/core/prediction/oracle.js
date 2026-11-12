/**
 * 卦象推演算法管线
 * 干支 → 小六壬 → 梅花易数 → 五行生克 → 加权抽样
 * 流程见 docs/DEV.md §1.3 B4
 */

import { randInt, weightedPick } from '../random.js';
import { yearGanzhi, dayGanzhi, hourGanzhi, wuxingProfile } from './wuxing.js';
import { liurenCast } from './liuren.js';
import { castGua, changedGua, lookupGua, TEMPER_QUOTA } from './gua.js';

/**
 * 统计窗口期红球频次（与 math.js 相同口径，独立实现保持 core 文件自治）
 * @param {import('../types.js').SSQDraw[]} history
 * @param {number} window
 * @returns {number[]} 长度 34，索引 0 弃用
 */
function redFreq(history, window) {
  const freq = new Array(34).fill(0);
  history.slice(0, window).forEach((d) => {
    d.reds.forEach((n) => {
      freq[n] += 1;
    });
  });
  return freq;
}

/**
 * 按频次 Z 分数划分热温冷三池（排除号与锁定号剔除）
 * @param {number[]} freq
 * @param {import('../types.js').AlgoContext} ctx
 * @returns {{hot: number[], warm: number[], cold: number[]}}
 */
function buildTiers(freq, ctx) {
  const total = freq.reduce((s, f) => s + f, 0);
  const mean = total / 33;
  const std = Math.sqrt(
    freq.slice(1).reduce((s, f) => s + (f - mean) ** 2, 0) / 33
  );
  const tiers = { hot: [], warm: [], cold: [] };
  for (let n = 1; n <= 33; n++) {
    if (ctx.excludes.redExcludes.includes(n)) continue;
    if (ctx.locks.redLocks.includes(n)) continue;
    const z = std > 0 ? (freq[n] - mean) / std : 0;
    if (z >= 0.75) tiers.hot.push(n);
    else if (z <= -0.75) tiers.cold.push(n);
    else tiers.warm.push(n);
  }
  return tiers;
}

/**
 * 池温偏移：小六壬落宫决定池配比微调
 * hot 偏移 → 热池 +1；cold 偏移 → 冷池 +1；balanced 不变
 * @param {{hot:number,warm:number,cold:number}} quota 卦性基础配比
 * @param {string} bias 落宫偏移
 * @param {number} need 本组还需抽取数
 * @returns {{hot:number,warm:number,cold:number}}
 */
function shiftQuota(quota, bias, need) {
  const q = { ...quota };
  if (bias === 'hot') q.hot += 1;
  if (bias === 'cold') q.cold += 1;
  // 总数超了就优先从温池砍，再从多出的一方砍
  let over = q.hot + q.warm + q.cold - need;
  while (over > 0) {
    if (q.warm > 0) q.warm -= 1;
    else if (q.hot > q.cold) q.hot -= 1;
    else q.cold -= 1;
    over -= 1;
  }
  return q;
}

/**
 * 从单池内按五行权重加权抽取 count 个
 * @param {number[]} pool
 * @param {number} count
 * @param {(n: number) => number} numberWeight 五行权重函数
 * @returns {number[]}
 */
function pickWeighted(pool, count, numberWeight) {
  const remain = [...pool];
  const picked = [];
  while (picked.length < count && remain.length > 0) {
    const weights = remain.map((n) => numberWeight(n));
    const n = weightedPick(remain, weights);
    picked.push(n);
    remain.splice(remain.indexOf(n), 1);
  }
  return picked;
}

/**
 * 生成一组卦象号码
 * @param {import('../types.js').AlgoContext} ctx
 * @param {object} cast 起局结果（卦、宫、五行）
 * @returns {import('../types.js').SSQPick}
 */
function generateOne(ctx, cast) {
  const { quota, numberWeight } = cast;
  const freq = redFreq(ctx.history, 30);
  const tiers = buildTiers(freq, ctx);
  const need = 6 - ctx.locks.redLocks.length;

  const q = shiftQuota(quota, cast.bias, need);
  const picked = [
    ...pickWeighted(tiers.hot, Math.min(q.hot, tiers.hot.length), numberWeight),
    ...pickWeighted(tiers.warm, Math.min(q.warm, tiers.warm.length), numberWeight),
    ...pickWeighted(tiers.cold, Math.min(q.cold, tiers.cold.length), numberWeight),
  ];

  // 兜底：配比落空时从全池（未锁定未排除未选中）随机补齐
  if (picked.length < need) {
    const rest = [];
    for (let n = 1; n <= 33; n++) {
      if (
        !ctx.excludes.redExcludes.includes(n) &&
        !ctx.locks.redLocks.includes(n) &&
        !picked.includes(n)
      ) {
        rest.push(n);
      }
    }
    while (picked.length < need && rest.length > 0) {
      picked.push(rest.splice(randInt(0, rest.length - 1), 1)[0]);
    }
  }

  // 蓝球：五行权重抽取
  let blue;
  if (ctx.locks.blueLock !== null) {
    blue = ctx.locks.blueLock;
  } else {
    const bluePool = [];
    for (let n = 1; n <= 16; n++) {
      if (!ctx.excludes.blueExcludes.includes(n)) bluePool.push(n);
    }
    blue = pickWeighted(bluePool, 1, numberWeight)[0];
  }

  return { reds: [...ctx.locks.redLocks, ...picked].sort((a, b) => a - b), blue };
}

/**
 * 卦象推演算法入口
 * @param {import('../types.js').AlgoContext} ctx
 * @param {number} groupCount 1–5
 * @returns {import('../types.js').AlgoResult}
 */
export function oraclePredict(ctx, groupCount) {
  const now = ctx.now;

   // 1. 干支标注（附起局钟表时刻，方便核对时辰）
   const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
   const ganzhi = {
     year: yearGanzhi(now),
     day: dayGanzhi(now),
     hour: `${hourGanzhi(now)}时（${hhmm} 起局）`,
   };

  // 2. 心念起数：点击毫秒 mod 6（数由心起的触机）
  const heartbeat = now.getMilliseconds() % 6;

  // 3. 小六壬落宫
  const liuren = liurenCast(now, heartbeat);

  // 4. 梅花易数起卦：本卦 + 动爻 + 变卦
  const gua = castGua(now);
  const ben = lookupGua(gua.upper, gua.lower);
  const bian = changedGua(gua.upper, gua.lower, gua.moving);
  const bianInfo = lookupGua(bian.upper, bian.lower);

  // 5. 五行权重
  const profile = wuxingProfile(now);

  // 6. 卦性配比 + 落宫偏移 → 抽样
  const quota = TEMPER_QUOTA[ben.temper] || TEMPER_QUOTA.守成;
  const cast = { quota, bias: liuren.bias, numberWeight: profile.numberWeight };

  const groups = [];
  for (let i = 0; i < groupCount; i++) {
    groups.push(generateOne(ctx, cast));
  }

  const reading = {
    ganzhi,
    liurenPalace: liuren.palace,
    liurenMeaning: liuren.meaning,
    guaName: ben ? ben.name : '卦象待考',
    guaText: ben ? ben.text : '',
    guaTemper: ben ? ben.temper : '守成',
    // 变卦提示附在五行表前，叙事更完整
    wuxingWeights: profile.weights,
    // 以下两个额外字段供展示层使用（超出 OracleReading 基础定义，向后兼容）
    movingLine: gua.moving,
    changedGuaName: bianInfo ? bianInfo.name : '',
  };

  return { groups, reading };
}
