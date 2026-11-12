/**
 * 随机工具 · 封装 crypto.getRandomValues，浏览器端质量保证
 * 纯函数集合，无 UI 依赖
 */

/** 密码学安全的 [0, 1) 浮点数 */
export function randFloat() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 4294967296;
}

/** 密码学安全的整数 [min, max]，含两端 */
export function randInt(min, max) {
  return min + Math.floor(randFloat() * (max - min + 1));
}

/**
 * 加权随机抽取一个元素
 * @param {T[]} items 候选元素
 * @param {number[]} weights 与 items 等长的权重数组
 * @returns {T} 抽中的元素
 * @template T
 */
export function weightedPick(items, weights) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = randFloat() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  // 浮点边界兜底：返回最后一个
  return items[items.length - 1];
}

/**
 * 从池中不放回抽取 count 个（Fisher–Yates 局部洗牌）
 * @param {T[]} pool 候选池，不修改原数组
 * @param {number} count 抽取个数
 * @returns {T[]}
 * @template T
 */
export function sampleWithoutReplacement(pool, count) {
  const arr = [...pool];
  const n = Math.min(count, arr.length);
  for (let i = 0; i < n; i++) {
    const j = randInt(i, arr.length - 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}
