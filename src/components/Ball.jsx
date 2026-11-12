import { pad2 } from '../core/validate.js';

/**
 * 号码球圆牌 · 全站复用（历史墙与生成结果同一组件）
 * @param {{n: number, color: 'red'|'blue'}} props
 */
export default function Ball({ n, color }) {
  return <span className={`ball ${color}`}>{pad2(n)}</span>;
}
