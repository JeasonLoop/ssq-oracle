/**
 * 今日一卦 · 日期种子的每日运势签
 * 以本地日期字符串做种子，同一天结果确定不变（规则见 docs/DEV.md §1.5）
 * 纯函数 + localStorage 连签记录，无 UI 依赖
 */

import { yearGanzhi, dayGanzhi } from './prediction/wuxing.js';

const FORTUNE_KEY = 'ssq-oracle.fortune.v1';

/** djb2 字符串哈希，转 32 位非负整数种子 */
function hashSeed(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** mulberry32 种子随机：同种子同序列，保证「每日一签」确定可复现 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 日期 → 本地 YYYY-MM-DD 键（今日一卦与连签共用） */
export function dateKey(now) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const LUCKY_HOURS = [
  '子时 23–01', '丑时 01–03', '寅时 03–05', '卯时 05–07',
  '辰时 07–09', '巳时 09–11', '午时 11–13', '未时 13–15',
  '申时 15–17', '酉时 17–19', '戌时 19–21', '亥时 21–23',
];

// 吉色引用 tokens.css 令牌名，保证明暗双主题同时可读
const LUCKY_COLORS = [
  { name: '朱红', token: 'var(--red-500)' },
  { name: '黛蓝', token: 'var(--blue-500)' },
  { name: '鎏金', token: 'var(--gold)' },
  { name: '月白', token: 'var(--ink)' },
  { name: '玄青', token: 'var(--ink-dim)' },
];

// 宜/忌为生活化趣味文案，不涉及购彩诱导（合规要求）
const YI_LIST = [
  '静心推演', '与友同乐', '记录所思', '早睡早起',
  '散步看月', '整理旧物', '读一页闲书', '给家里打个电话',
];
const JI_LIST = ['冲动下注', '连占不休', '熬夜守奖', '贪多求全', '与人置气', '暴饮暴食'];

const SIGNS = [
  { level: '上签', text: '云开月正明，稳行自有成。' },
  { level: '上签', text: '静水映天光，不动胜惊慌。' },
  { level: '上签', text: '枯木逢春雨，新枝自然舒。' },
  { level: '中签', text: '风起絮飞扬，且慢且思量。' },
  { level: '中签', text: '山径多盘桓，徐行亦可攀。' },
  { level: '中签', text: '雾里看灯明，近前未必真。' },
  { level: '平签', text: '潮落待潮生，守拙即安宁。' },
  { level: '平签', text: '闲敲棋一局，胜负两由之。' },
];

/**
 * 取某日的运势签（纯函数，同日确定）
 * @param {Date} now
 */
export function getFortune(now) {
  const key = dateKey(now);
  const rand = mulberry32(hashSeed('ssq-fortune-' + key));
  const pickOne = (arr) => arr[Math.floor(rand() * arr.length)];

  // 每日推荐号：种子随机一组，独立玩法，不受幸运号锁定/排除影响
  const pool = [];
  for (let n = 1; n <= 33; n++) pool.push(n);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const reds = pool.slice(0, 6).sort((a, b) => a - b);
  const blue = 1 + Math.floor(rand() * 16);

  return {
    dateKey: key,
    ganzhi: { year: yearGanzhi(now), day: dayGanzhi(now) },
    sign: pickOne(SIGNS),
    luckyHour: pickOne(LUCKY_HOURS),
    luckyColor: pickOne(LUCKY_COLORS),
    yi: pickOne(YI_LIST),
    ji: pickOne(JI_LIST),
    pick: { reds, blue },
  };
}

/** 读连签记录 */
export function readStreak() {
  try {
    return JSON.parse(localStorage.getItem(FORTUNE_KEY)) || { lastDate: '', streak: 0 };
  } catch {
    return { lastDate: '', streak: 0 };
  }
}

/**
 * 记录今日到访并计算连签天数（昨天来过 +1，否则重置为 1）
 * @param {string} key 今日日期键
 * @returns {number} 最新连签天数
 */
export function touchStreak(key) {
  const st = readStreak();
  if (st.lastDate === key) return st.streak;
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const streak = st.lastDate === dateKey(yesterday) ? st.streak + 1 : 1;
  try {
    localStorage.setItem(FORTUNE_KEY, JSON.stringify({ lastDate: key, streak }));
  } catch {
    // 静默降级
  }
  return streak;
}
