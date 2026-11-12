/**
 * 天干地支 + 五行生克
 * 干支换算规则与简化口径见 docs/DEV.md §1.3 B3
 * 纯函数，无 UI 依赖
 */

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 天干五行：甲乙木 丙丁火 戊己土 庚辛金 壬癸水
const STEM_WUXING = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
// 地支五行：寅卯木 巳午火 申酉金 亥子水 辰戌丑未土
const BRANCH_WUXING = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];

// 五行相生：木→火→土→金→水→木
const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
// 五行相克：木→土→水→火→金→木
const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

/** 由五行 X 求「生我者」：生 X 的那一行 */
function shengWo(x) {
  for (const from of Object.keys(SHENG)) {
    if (SHENG[from] === x) return from;
  }
  return x;
}

/** 由五行 X 求「克我者」：克 X 的那一行 */
function keWo(x) {
  for (const from of Object.keys(KE)) {
    if (KE[from] === x) return from;
  }
  return x;
}

/**
 * 年干支（简化口径：按公历年，立春分界未纳入，娱乐场景足够）
 * 1984 年为甲子年
 * @param {Date} now
 * @returns {string} 如 "乙巳"
 */
export function yearGanzhi(now) {
  const offset = now.getFullYear() - 1984;
  const stem = STEMS[((offset % 10) + 10) % 10];
  const branch = BRANCHES[((offset % 12) + 12) % 12];
  return stem + branch;
}

/**
 * 日干支：以 2000-01-01（戊午日）为基准，按天数偏移
 * @param {Date} now
 * @returns {string} 如 "甲子"
 */
export function dayGanzhi(now) {
  const base = Date.UTC(2000, 0, 1);
  const target = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((target - base) / 86400000);
  // 戊午 = 天干第 5（戊，索引 4），地支第 8（午，索引 7）→ 60 甲子序 54（0 起）
  const idx = (((days + 54) % 60) + 60) % 60;
  return STEMS[idx % 10] + BRANCHES[idx % 12];
}

/**
 * 时干支：五鼠遁——甲己日起甲子时，乙庚日起丙子时……
 * @param {Date} now
 * @returns {string} 如 "庚午"
 */
export function hourGanzhi(now) {
  // 时支：23–01 子时，每 2 小时一支；注意 23 点属于次日子时（此处简化为当日）
  const h = now.getHours();
  const branchIdx = Math.floor(((h + 1) % 24) / 2); // 0=子…11=亥
  // 日干序数（甲=0）
  const dayGz = dayGanzhi(now);
  const dayStemIdx = STEMS.indexOf(dayGz[0]);
  // 五鼠遁：时干起点 = (日干序数 mod 5) * 2
  const hourStemIdx = ((dayStemIdx % 5) * 2 + branchIdx) % 10;
  return STEMS[hourStemIdx] + BRANCHES[branchIdx];
}

/**
 * 干支 → 五行（取地支五行为准，地支为「体」）
 * @param {string} ganzhi 两字干支
 * @returns {string} 五行之一
 */
export function ganzhiWuxing(ganzhi) {
  const branchIdx = BRANCHES.indexOf(ganzhi[1]);
  return BRANCH_WUXING[branchIdx];
}

/**
 * 日主五行（日支五行）
 * @param {Date} now
 * @returns {string}
 */
export function dayMasterWuxing(now) {
  return ganzhiWuxing(dayGanzhi(now));
}

/**
 * 号码五行映射（河图数理转译）：1、6 水，2、7 火，3、8 木，4、9 金，5、10 土
 * @param {number} n 号码
 * @returns {string}
 */
export function numberWuxing(n) {
  const m = n % 10;
  if (m === 1 || m === 6) return '水';
  if (m === 2 || m === 7) return '火';
  if (m === 3 || m === 8) return '木';
  if (m === 4 || m === 9) return '金';
  return '土'; // 0、5
}

/**
 * 生克权重：同我 1.3 / 生我 1.5 / 我生 1.2 / 我克 0.9 / 克我 0.7
 * @param {string} dayMaster 日主五行
 * @param {string} target 目标五行
 * @returns {number}
 */
export function shengkeWeight(dayMaster, target) {
  if (target === dayMaster) return 1.3; // 同我
  if (SHENG[dayMaster] === target) return 1.2; // 我生者（泄，略扶）
  if (shengWo(target) === dayMaster) return 1.5; // 生我者（印，最扶）
  if (KE[dayMaster] === target) return 0.9; // 我克者（财，中性偏扶）
  if (keWo(target) === dayMaster) return 0.7; // 克我者（官杀，压）
  return 1.0;
}

/**
 * 汇总：给定时刻的五行权重表（用于结果展示）与号码权重函数（用于抽样）
 * @param {Date} now
 * @returns {{weights: {element: string, weight: number}[], numberWeight: (n: number) => number}}
 */
export function wuxingProfile(now) {
  const master = dayMasterWuxing(now);
  const elements = ['木', '火', '土', '金', '水'];
  const weights = elements.map((element) => ({
    element,
    weight: shengkeWeight(master, element),
  }));
  const numberWeight = (n) => shengkeWeight(master, numberWuxing(n));
  return { master, weights, numberWeight };
}
