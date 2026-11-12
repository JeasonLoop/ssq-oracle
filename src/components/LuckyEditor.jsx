import { pad2 } from '../core/validate.js';
 import { Lock, Ban } from 'lucide-react';

/**
 * 幸运号编辑器
 * 红球 33 颗 / 蓝球 16 颗点选；mode 决定点击行为是「锁定」还是「排除」
 * 校验逻辑集中在 core/validate.js，这里只负责交互与状态
 * @param {{
 *   redLocks: number[], blueLock: number|null,
 *   redExcludes: number[], blueExcludes: number[],
 *   mode: 'lock'|'exclude',
 *   onToggleRed: (n: number) => void,
 *   onToggleBlue: (n: number) => void,
 * }} props
 */
export default function LuckyEditor({
  redLocks, blueLock, redExcludes, blueExcludes,
  mode, onToggleRed, onToggleBlue,
}) {
  const redState = (n) => {
    if (redLocks.includes(n)) return 'is-lock';
    if (redExcludes.includes(n)) return 'is-exclude';
    return '';
  };
  const blueState = (n) => {
    if (blueLock === n) return 'is-lock';
    if (blueExcludes.includes(n)) return 'is-exclude';
    return '';
  };

  return (
    <div>
      <div className="form-hint">
         {mode === 'lock'
           ? <span><Lock size={12} /> 锁定（点击号码加入必出）</span>
           : <span><Ban size={12} /> 排除（点击号码从候选剔除）</span>}
      </div>

      <div className="lucky-grid" style={{ marginTop: 'calc(var(--space-unit) * 2)' }}>
        {Array.from({ length: 33 }, (_, i) => i + 1).map((n) => (
          <button
            key={`r${n}`}
            className={`lucky-ball red ${redState(n)}`}
            onClick={() => onToggleRed(n)}
          >
            {pad2(n)}
          </button>
        ))}
      </div>

      <div className="lucky-grid" style={{ marginTop: 'calc(var(--space-unit) * 3)' }}>
        {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
          <button
            key={`b${n}`}
            className={`lucky-ball blue ${blueState(n)}`}
            onClick={() => onToggleBlue(n)}
          >
            {pad2(n)}
          </button>
        ))}
      </div>
    </div>
  );
}
