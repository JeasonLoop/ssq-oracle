/**
 * 历史数据读取与查询 · 未来切换远程数据源时只改这里
 * 数据文件：src/data/draws.json（schema 见 DEV.md §3）
 */

import drawsJson from '../data/draws.json';

/**
 * 取全部开奖记录（按期号降序，数据文件本身即降序）
 * @returns {import('./types.js').SSQDraw[]}
 */
export function loadDraws() {
  return drawsJson.draws;
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
