/**
 * 历史数据读取与查询 · 未来切换远程数据源时只改这里
 * 数据文件：src/data/draws.json（schema 见 DEV.md §3）
 * 本地导入：用户粘贴的新开奖存 localStorage，与内置数据合并（导入优先，规则见 DEV.md §1.10）
 */

import drawsJson from '../data/draws.json';

const IMPORT_KEY = 'ssq-oracle.draws.imported.v1';

/** 读本地导入的开奖记录 */
function readImported() {
  try {
    return JSON.parse(localStorage.getItem(IMPORT_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * 取全部开奖记录：内置数据 + 本地导入数据，按期号降序
 * 同期号以导入数据优先（视为更新的修正数据）
 * @returns {import('./types.js').SSQDraw[]}
 */
export function loadDraws() {
  const imported = readImported();
  if (imported.length === 0) return drawsJson.draws;
  const byIssue = new Map();
  drawsJson.draws.forEach((d) => byIssue.set(d.issue, d));
  imported.forEach((d) => byIssue.set(d.issue, d));
  return [...byIssue.values()].sort((a, b) => b.issue.localeCompare(a.issue));
}

/**
 * 取最近 n 期
 * @param {number} n 最多 45
 * @returns {import('./types.js').SSQDraw[]}
 */
export function recentDraws(n) {
  return loadDraws().slice(0, n);
}

/**
 * 期号关键字搜索
 * @param {string} keyword
 * @returns {import('./types.js').SSQDraw[]}
 */
export function searchByIssue(keyword) {
  const all = loadDraws();
  if (!keyword) return all;
  return all.filter((d) => d.issue.includes(keyword));
}

/**
 * 统计某红球号码在给定窗口期内的出现次数
 * @param {number} red 红球号码 1–33
 * @param {number} window 窗口期数，默认 45
 * @returns {number}
 */
export function countRed(red, window = 45) {
  return recentDraws(window).filter((d) => d.reds.includes(red)).length;
}

/**
 * 解析粘贴的开奖文本，每行一期：期号 日期 红×6 蓝
 * 分隔符容错：空格 / 逗号 / 中文逗号 / 、/ 制表符；日期可缺省
 * @param {string} text
 * @returns {{good: import('./types.js').SSQDraw[], bad: string[]}} good 为合法记录，bad 为无法解析的原始行
 */
export function parseDrawsText(text) {
  const good = [];
  const bad = [];
  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    const parts = line.split(/[\s,，、\t]+/).filter(Boolean);
    // 第一段必须是期号
    if (!/^\d{5,8}$/.test(parts[0] || '')) {
      bad.push(line);
      return;
    }
    const issue = parts[0];
    let date = '';
    let rest = parts.slice(1);
    // 第二段若形如日期则取为开奖日，否则缺省
    if (rest.length > 0 && /^\d{4}-\d{1,2}-\d{1,2}$/.test(rest[0])) {
      date = rest[0];
      rest = rest.slice(1);
    }
    const nums = rest.map(Number);
    const reds = nums.slice(0, 6);
    const blue = nums[6];
    const redsValid =
      nums.length === 7 &&
      reds.every((n) => Number.isInteger(n) && n >= 1 && n <= 33) &&
      new Set(reds).size === 6;
    const blueValid = Number.isInteger(blue) && blue >= 1 && blue <= 16;
    if (!redsValid || !blueValid) {
      bad.push(line);
      return;
    }
    good.push({ issue, date, reds: reds.sort((a, b) => a - b), blue });
  });
  return { good, bad };
}

/**
 * 合并导入的开奖记录（按期号去重，已存在期号跳过）
 * @param {import('./types.js').SSQDraw[]} draws
 * @returns {number} 实际新增期数
 */
export function importDraws(draws) {
  const existing = readImported();
  const seen = new Set(existing.map((d) => d.issue));
  let added = 0;
  draws.forEach((d) => {
    if (!seen.has(d.issue)) {
      existing.push(d);
      seen.add(d.issue);
      added += 1;
    }
  });
  try {
    localStorage.setItem(IMPORT_KEY, JSON.stringify(existing));
  } catch {
    return 0;
  }
  return added;
}

/** 清空本地导入的开奖记录（恢复内置数据） */
export function clearImportedDraws() {
  try {
    localStorage.removeItem(IMPORT_KEY);
  } catch {
    // 静默降级
  }
}
