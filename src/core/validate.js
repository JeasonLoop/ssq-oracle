/**
 * 幸运号约束校验 · 全站唯一校验实现（UI 层只调用不重复实现）
 * 规则清单见 docs/DEV.md §1.2，此处逐条落地
 */

/**
 * 校验幸运号约束
 * @param {import('./types.js').NumberLocks} locks 锁定号
 * @param {import('./types.js').NumberLocks} excludes 排除号
 * @returns {string[]} 错误文案数组，空数组 = 通过
 */
export function validateLocks(locks, excludes) {
  const errors = [];

  const redLocks = locks.redLocks || [];
  const redExcludes = excludes.redExcludes || [];
  const blueLock = locks.blueLock;
  const blueExcludes = excludes.blueExcludes || [];

  // 基础范围检查（防御性，正常 UI 不会产生越界值）
  const redRange = (n) => n >= 1 && n <= 33;
  const blueRange = (n) => n >= 1 && n <= 16;
  if (redLocks.some((n) => !redRange(n)) || redExcludes.some((n) => !redRange(n))) {
    errors.push('红球号码必须在 01–33 范围内');
  }
  if ((blueLock !== null && !blueRange(blueLock)) || blueExcludes.some((n) => !blueRange(n))) {
    errors.push('蓝球号码必须在 01–16 范围内');
  }

  // 锁定数量上限
  if (redLocks.length > 6) {
    errors.push('锁定红球最多 6 个');
  }
  if (blueExcludes.length >= 16 && blueLock === null) {
    errors.push('蓝球已全部排除，必须锁定一个蓝球');
  }

  // 锁定与排除交集必须为空
  const redOverlap = redLocks.filter((n) => redExcludes.includes(n));
  if (redOverlap.length > 0) {
    errors.push(`红球锁定与排除重叠：${redOverlap.map(pad2).join('、')}`);
  }
  if (blueLock !== null && blueExcludes.includes(blueLock)) {
    errors.push(`蓝球 ${pad2(blueLock)} 同时被锁定和排除`);
  }

  // 可行解空间检查：锁定红 + 排除红 ≤ 32（33 个号码去掉 1 个仍可凑 6 红）
  // 注：锁定红最多 6 个，锁定 6 个时排除必须为 0，否则无解
  if (redLocks.length + redExcludes.length > 32) {
    errors.push('锁定与排除红球总数过多，无可行组合');
  }

  return errors;
}

/**
 * 蓝球可行域检查（排除后是否还有可选蓝球）
 * @param {import('./types.js').NumberLocks} excludes
 * @returns {boolean} true = 还有可选蓝球
 */
export function bluePoolAvailable(excludes) {
  return 16 - (excludes.blueExcludes || []).length > 0;
}

/** 数字补零显示 01 */
export function pad2(n) {
  return String(n).padStart(2, '0');
}
