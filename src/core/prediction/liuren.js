/**
 * 小六壬（六宫掐指）
 * 六宫序列：大安→留连→速喜→赤口→小吉→空亡
 * 起法：月、日、时（辰序数）依次从大安起顺数，落宫定吉凶基调
 * 工程转译口径见 docs/DEV.md §1.3 B1
 */

export const PALACES = ['大安', '留连', '速喜', '赤口', '小吉', '空亡'];

// 宫位断语（传统口诀，用于结果叙事）
export const PALACE_MEANINGS = {
  大安: '大安事事昌，求谋在东方，失物去不远，宅舍保安康',
  留连: '留连事难成，求谋日未明，官事凡不宜，去者未回程',
  速喜: '速喜喜来临，求财向南行，失物申未午，逢人路上寻',
  赤口: '赤口主口舌，官非切宜防，失物速讨债，行人有惊慌',
  小吉: '小吉最吉昌，路上好商量，阴人来报喜，失物在坤方',
  空亡: '空亡事不祥，阴人多乖张，求财无利益，行人有灾殃',
};

// 落宫 → 池温偏移（工程转译：吉宫向热号偏移，空亡向冷门偏移）
export const PALACE_BIAS = {
  大安: 'hot',
  速喜: 'hot',
  小吉: 'hot',
  留连: 'balanced',
  赤口: 'balanced',
  空亡: 'cold',
};

/**
 * 掐指起课
 * @param {Date} now 起局时刻
 * @param {number} heartbeat 心念起数（毫秒 mod 6，0–5）
 * @returns {{palace: string, meaning: string, bias: string}}
 */
export function liurenCast(now, heartbeat = 0) {
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hourIdx = Math.floor(((now.getHours() + 1) % 24) / 2); // 0=子…11=亥
  const hourNum = hourIdx + 1;

  // 月、日、时三数依次顺数，每段从大安起；心念起数并入「时」的触机
  const steps = month + day + hourNum + heartbeat;
  const idx = ((steps - 1) % 6 + 6) % 6; // 从大安（索引 0）起，第 steps 步落宫
  const palace = PALACES[idx];
  return {
    palace,
    meaning: PALACE_MEANINGS[palace],
    bias: PALACE_BIAS[palace],
  };
}
