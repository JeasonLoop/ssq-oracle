import { pad2 } from '../core/validate.js';

/**
 * 号码球圆牌 · 全站复用（历史墙与生成结果同一组件）
  * @param {{n: number, color: 'red'|'blue', dual?: boolean}} props dual 为双盘对推描金高亮
 */
 export default function Ball({ n, color, dual }) {
   return <span className={`ball ${color}${dual ? ' is-dual' : ''}`}>{pad2(n)}</span>;
}
