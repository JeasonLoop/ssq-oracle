/**
 * 命理盘算法 · 生日灵数 + 生肖 + 星座
 * 规则转译见 docs/DEV.md §1.7，纯娱乐、无 UI 依赖
 */

import { randInt, weightedPick } from '../random.js';
import { shengkeWeight, numberWuxing, yearGanzhi, dayGanzhi } from './wuxing.js';

// 生肖按地支序：子鼠、丑牛……（年支近似 (年份-4) mod 12，与 wuxing 年干支同口径）
const ZODIAC_NAMES = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
// 地支五行：子水 丑土 寅木 卯木 辰土 巳火 午火 未土 申金 酉金 戌土 亥水
const ZODIAC_WUXING = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];

// 12 星座：起始月日 + 四象归五行（风→木）+ 卦性映射 + 断语文案
const CONSTELLATIONS = [
  { name: '摩羯座', start: [12, 22], element: '土', temper: '静守', text: '山止而厚，行远自迩。' },
  { name: '水瓶座', start: [1, 20], element: '木', temper: '变通', text: '风行水上，不拘一格。' },
  { name: '双鱼座', start: [2, 19], element: '水', temper: '静守', text: '水润万物，柔能克刚。' },
  { name: '白羊座', start: [3, 21], element: '火', temper: '进取', text: '火燃原上，其势正锐。' },
  { name: '金牛座', start: [4, 20], element: '土', temper: '守成', text: '土厚载物，稳中藏金。' },
  { name: '双子座', start: [5, 21], element: '木', temper: '变通', text: '木秀于林，左右逢源。' },
  { name: '巨蟹座', start: [6, 22], element: '水', temper: '守成', text: '水抱山环，守内有恒。' },
  { name: '狮子座', start: [7, 23], element: '火', temper: '进取', text: '日丽中天，光而不耀。' },
  { name: '处女座', start: [8, 23], element: '土', temper: '守成', text: '土细如坊，理而后动。' },
  { name: '天秤座', start: [9, 23], element: '木', temper: '变通', text: '风摆天平，权衡两仪。' },
  { name: '天蝎座', start: [10, 24], element: '水', temper: '守成', text: '水深流静，藏锋于渊。' },
  { name: '射手座', start: [11, 23], element: '火', temper: '进取', text: '火传薪木，志在四方。' },
];

// 生肖断语（叙事文案，供盘面展示）
const ZODIAC_TEXTS = {
  鼠: '机敏藏智，暗中有路。',
  牛: '厚积薄发，稳踏实地。',
  虎: '威而不怒，静待风来。',
  兔: '动如脱兔，贵在巧思。',
  龙: '云从龙起，乘时而上。',
  蛇: '盘而不僵，伺机而动。',
  马: '天行健，一马当先。',
  羊: '温良得助，众心成城。',
  猴: '巧变通达，笑对千机。',
  鸡: '司晨守时，一鸣惊人。',
  狗: '忠直有信，守得云开。',
  猪: '福气自足，宽心即安。',
};

/**
 * 公历年 → 生肖序（0=子鼠）
 * @param {number} year
 */
function zodiacIndex(year) {
  return (((year - 4) % 12) + 12) % 12;
}

/**
 * 按月日查星座（摩羯跨年：12/22–1/19）
 * @param {number} month 1–12
 * @param {number} day
 */
function constellationOf(month, day) {
  let found = CONSTELLATIONS[0]; // 默认摩羯（覆盖 1/1–1/19）
  for (const c of CONSTELLATIONS) {
    if (month > c.start[0] || (month === c.start[0] && day >= c.start[1])) {
      found = c;
    }
  }
  return found;
}

/** 生命灵数：生日各位数字反复求和至 1–9 */
function lifeNumber(birth) {
  const digits = birth.replace(/\D/g, '').split('').map(Number);
  let sum = digits.reduce((s, d) => s + d, 0);
  while (sum > 9) {
    sum = String(sum).split('').map(Number).reduce((s, d) => s + d, 0);
  }
  return sum;
}

/** 号码的数字根（如 28 → 10 → 1） */
function digitalRoot(n) {
  while (n > 9) {
    n = String(n).split('').map(Number).reduce((s, d) => s + d, 0);
  }
  return n;
}

/**
 * 池内按权重不放回抽取 count 个
 * @param {number[]} pool
 * @param {number} count
 * @param {(n: number) => number} weightOf
 */
function pickWeighted(pool, count, weightOf) {
  const remain = [...pool];
  const picked = [];
  while (picked.length < count && remain.length > 0) {
    const n = weightedPick(remain, remain.map(weightOf));
    picked.push(n);
    remain.splice(remain.indexOf(n), 1);
  }
  return picked;
}

/**
 * 生成一组命理号码
 * @param {import('../types.js').AlgoContext} ctx
 * @param {{life: number, zodiacWX: string, constWX: string}} profile
 * @returns {import('../types.js').SSQPick}
 */
function generateOne(ctx, profile) {
  const { life, zodiacWX, constWX } = profile;
  // 号码权重 = 生肖生克 × 星座亲和 × 本命数加成
  const weightOf = (n) => {
    let w = shengkeWeight(zodiacWX, numberWuxing(n));
    w *= shengkeWeight(constWX, numberWuxing(n));
    if (digitalRoot(n) === life) w *= 1.6;
    return w;
  };

  const redPool = [];
  for (let n = 1; n <= 33; n++) {
    if (ctx.excludes.redExcludes.includes(n)) continue;
    if (ctx.locks.redLocks.includes(n)) continue;
    redPool.push(n);
  }
  const need = 6 - ctx.locks.redLocks.length;
  const picked = pickWeighted(redPool, need, weightOf);
  // 兜底：极端排除场景下池中已选尽时随机补齐
  if (picked.length < need) {
    const rest = redPool.filter((n) => !picked.includes(n));
    while (picked.length < need && rest.length > 0) {
      picked.push(rest.splice(randInt(0, rest.length - 1), 1)[0]);
    }
  }

  let blue;
  if (ctx.locks.blueLock !== null) {
    blue = ctx.locks.blueLock;
  } else {
    const bluePool = [];
    for (let n = 1; n <= 16; n++) {
      if (!ctx.excludes.blueExcludes.includes(n)) bluePool.push(n);
    }
    blue = pickWeighted(bluePool, 1, weightOf)[0];
  }

  return { reds: [...ctx.locks.redLocks, ...picked].sort((a, b) => a - b), blue };
}

/**
 * 命理盘算法入口
 * @param {import('../types.js').AlgoContext} ctx 需要 ctx.birth（YYYY-MM-DD）
 * @param {number} groupCount 1–5
 * @returns {import('../types.js').AlgoResult}
 */
export function destinyPredict(ctx, groupCount) {
  const birth = ctx.birth;
  if (!birth) throw new Error('命理盘需要生日');
  const [y, m, d] = birth.split('-').map(Number);
  const birthDate = new Date(y, m - 1, d);

  const zodiacIdx = zodiacIndex(y);
  const zodiacName = ZODIAC_NAMES[zodiacIdx];
  const zodiacWX = ZODIAC_WUXING[zodiacIdx];
  const cons = constellationOf(m, d);
  const life = lifeNumber(birth);
  const profile = { life, zodiacWX, constWX: cons.element };

  const groups = [];
  for (let i = 0; i < groupCount; i++) {
    groups.push(generateOne(ctx, profile));
  }

  // 复用 OracleReading 叙事：落宫位=生肖（附灵数）、卦名=星座、五行旺衰以生肖行为日主
  const elements = ['木', '火', '土', '金', '水'];
  const reading = {
    ganzhi: {
      year: yearGanzhi(birthDate),
      day: dayGanzhi(birthDate),
      hour: '', // 生时未知，盘面隐藏时辰
    },
    liurenPalace: `生肖属${zodiacName}（灵数 ${life}）`,
    liurenMeaning: ZODIAC_TEXTS[zodiacName],
    guaName: cons.name,
    guaText: cons.text,
    guaTemper: cons.temper,
    wuxingWeights: elements.map((element) => ({
      element,
      weight: shengkeWeight(zodiacWX, element),
    })),
  };

  return { groups, reading };
}
