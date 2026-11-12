/**
 * 预测算法统一调度
 * 新增算法：在 prediction/ 下新建文件，在此注册即可
 */

import { mathPredict } from './math.js';
import { oraclePredict } from './oracle.js';

export const ALGOS = {
  math: { key: 'math', label: '数学期望', desc: '频次 · 热温冷 · 遗漏回补', predict: mathPredict },
  oracle: { key: 'oracle', label: '卦象推演', desc: '干支 · 小六壬 · 梅花易数 · 五行', predict: oraclePredict },
};

/**
 * 统一预测入口
 * @param {'math'|'oracle'} kind 算法标识
 * @param {import('../types.js').AlgoContext} ctx
 * @param {number} groupCount 1–5
 * @returns {import('../types.js').AlgoResult}
 */
export function predict(kind, ctx, groupCount) {
  const algo = ALGOS[kind];
  if (!algo) throw new Error(`未知算法：${kind}`);
  return algo.predict(ctx, groupCount);
}
