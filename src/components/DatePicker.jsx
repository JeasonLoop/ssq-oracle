import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { pad2 } from '../core/validate.js';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

/**
 * 自绘日期选择器 · 主题化
 * 原生 input[type=date] 的日历弹层由浏览器 UA 绘制、无法定制样式，
 * 与暗堂/明堂主题脱节，故自绘面板：全部引用 tokens 令牌，双主题自适配。
 * @param {{value: string, onChange: (v: string) => void}} props
 *   value/onChange 均为 'YYYY-MM-DD'，允许空串（未选择）
 */
export default function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  // 面板浏览的年月：有值以值为准，否则今天
  const initial = value ? parseDate(value) : new Date();
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });
  const rootRef = useRef(null);

  function parseDate(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /** 点击面板外 / Esc 关闭 */
  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggleOpen() {
    if (!open) {
      const base = value ? parseDate(value) : new Date();
      setView({ y: base.getFullYear(), m: base.getMonth() });
    }
    setOpen(!open);
  }

  function pick(y, m, d) {
    onChange(`${y}-${pad2(m + 1)}-${pad2(d)}`);
    setOpen(false);
  }

  function pickToday() {
    const t = new Date();
    pick(t.getFullYear(), t.getMonth(), t.getDate());
  }

  function clearValue() {
    onChange('');
    setOpen(false);
  }

  function shiftMonth(delta) {
    setView((prev) => {
      const next = new Date(prev.y, prev.m + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });
  }

  // 当月网格：周一开头；月初前的空位留白
  const firstDay = new Date(view.y, view.m, 1);
  const leadBlanks = (firstDay.getDay() + 6) % 7; // getDay 0=周日 → 周一开头偏移
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const todayKey = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`;
  })();
  const selected = value ? parseDate(value) : null;

  const label = value
    ? `${selected.getFullYear()}年${selected.getMonth() + 1}月${selected.getDate()}日`
    : '选择生日';

  return (
    <span className="date-picker" ref={rootRef}>
      <button type="button" className="dp-trigger" onClick={toggleOpen}>
        <Calendar size={14} />
        {label}
      </button>

      {open && (
        <div className="dp-panel">
          <div className="dp-head">
            <button type="button" className="dp-nav" onClick={() => shiftMonth(-1)} aria-label="上一月">
              <ChevronLeft size={15} />
            </button>
            <span className="dp-title">{view.y}年{view.m + 1}月</span>
            <button type="button" className="dp-nav" onClick={() => shiftMonth(1)} aria-label="下一月">
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="dp-week">
            {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
          </div>

          <div className="dp-grid">
            {Array.from({ length: leadBlanks }, (_, i) => <span key={`b${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const isSelected =
                selected &&
                selected.getFullYear() === view.y &&
                selected.getMonth() === view.m &&
                selected.getDate() === d;
              const isToday = todayKey === `${view.y}-${view.m}-${d}`;
              return (
                <button
                  type="button"
                  key={d}
                  className={'dp-day' + (isSelected ? ' is-selected' : '') + (isToday ? ' is-today' : '')}
                  onClick={() => pick(view.y, view.m, d)}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="dp-foot">
            <button type="button" className="dp-ghost" onClick={pickToday}>今天</button>
            <button type="button" className="dp-ghost" onClick={clearValue} disabled={!value}>清除</button>
          </div>
        </div>
      )}
    </span>
  );
}
