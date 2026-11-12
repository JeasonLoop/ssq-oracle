/**
 * 卦签夹 · 存号与对奖（纯本地，无网络请求）
 * 收签与奖级判定规则见 docs/DEV.md §1.6
 */
 const PICKS_KEY = 'ssq-oracle.picks.v1';

/**
 * 读全部卦签（按存入时间倒序，新的在前）
 * @returns {import('./types.js').StoredPick[]}
 */
export function listPicks() {
  try {
    return JSON.parse(localStorage.getItem(PICKS_KEY)) || [];
  } catch {
    return [];
  }
}

function savePicks(picks) {
  try {
    localStorage.setItem(PICKS_KEY, JSON.stringify(picks));
  } catch {
    // 静默降级
  }
}

/** 两组号码相同（红球序列 + 蓝球）即视为同一签 */
function samePick(a, b) {
  return a.blue === b.blue && a.reds.join(',') === b.reds.join(',');
}

/**
 * 收入一签；同组号码已存在时跳过
 * @param {import('./types.js').SSQPick} pick
 * @param {string} algo 生成算法标识
 * @returns {import('./types.js').StoredPick[]} 更新后的卦签列表
 */
export function addPick(pick, algo) {
  const picks = listPicks();
  if (picks.some((p) => samePick(p, pick))) return picks;
  picks.unshift({
    id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    reds: [...pick.reds],
    blue: pick.blue,
    algo,
    savedAt: new Date().toISOString(),
  });
  savePicks(picks);
  return picks;
}

/**
 * 删除一签
 * @param {string} id
 * @returns {import('./types.js').StoredPick[]} 更新后的卦签列表
 */
export function removePick(id) {
  const picks = listPicks().filter((p) => p.id !== id);
  savePicks(picks);
  return picks;
}

/**
 * 双色球奖级判定（规则见 docs/DEV.md §1.6）
 * @param {import('./types.js').SSQPick} pick
 * @param {import('./types.js').SSQDraw} draw 对比的开奖期
 * @returns {{redHits: number[], blueHit: boolean, prize: string|null}}
 */
export function judgePick(pick, draw) {
  const redHits = pick.reds.filter((n) => draw.reds.includes(n));
  const blueHit = draw.blue === pick.blue;
  const redCount = redHits.length;
  let prize = null;
  if (redCount === 6 && blueHit) prize = '一等奖';
  else if (redCount === 6) prize = '二等奖';
  else if (redCount === 5 && blueHit) prize = '三等奖';
  else if (redCount === 5 || (redCount === 4 && blueHit)) prize = '四等奖';
  else if (redCount === 4 || (redCount === 3 && blueHit)) prize = '五等奖';
  else if (blueHit) prize = '六等奖';
  return { redHits, blueHit, prize };
}

/** 算法标识 → 中文名（卦签夹展示用） */
export function algoLabel(algo) {
  return { math: '数学期望', oracle: '卦象推演', destiny: '命理盘' }[algo] || algo;
}
