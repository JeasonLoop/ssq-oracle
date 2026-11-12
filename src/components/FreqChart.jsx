import { pad2 } from '../core/validate.js';

/**
 * 频次柱状图 · 纯 CSS 实现，不引入图表库
 * 柱高按 频次/最大频次 比例，热号描金，红柱可点选与历史高亮联动
 * @param {{
 *   nums: number[],                    // 横轴号码列表
 *   freqOf: (n: number) => number,     // 号码 → 频次
 *   color: 'red'|'blue',
 *   selected?: number|null,            // 当前点选号码（仅红球用）
 *   onSelect?: (n: number) => void,    // 点选回调（传入才可点击）
 * }} props
 */
export default function FreqChart({ nums, freqOf, color, selected = null, onSelect }) {
  const counts = nums.map((n) => freqOf(n));
  const max = Math.max(...counts, 1);

  return (
    <div className={`freq-chart ${color}`}>
      {nums.map((n, i) => {
        const c = counts[i];
        const isHot = c === max && max > 1;
        const isSelected = selected === n;
        return (
          <div key={n} className="freq-col" title={`${pad2(n)} 出现 ${c} 次`}>
            <div className={'freq-count' + (isHot ? ' is-hot' : '')}>{c}</div>
            <div className="freq-slot">
              <div
                className={
                  'freq-bar ' + color +
                  (isHot ? ' is-hot' : '') +
                  (isSelected ? ' is-selected' : '')
                }
                style={{ height: `${Math.max((c / max) * 100, 4)}%` }}
                onClick={onSelect ? () => onSelect(n) : undefined}
                role={onSelect ? 'button' : undefined}
              />
            </div>
            <div className="freq-label">{pad2(n)}</div>
          </div>
        );
      })}
    </div>
  );
}
