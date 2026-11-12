/**
 * 组数步进器 · 1–5 组
 * @param {{value: number, onChange: (v: number) => void}} props
 */
export default function GroupCountStepper({ value, onChange }) {
  const dec = () => onChange(Math.max(1, value - 1));
  const inc = () => onChange(Math.min(5, value + 1));
  return (
    <div className="stepper">
      <button className="btn-ghost" onClick={dec} disabled={value <= 1} aria-label="减少一组">−</button>
      <span className="stepper-value">{value} 组</span>
      <button className="btn-ghost" onClick={inc} disabled={value >= 5} aria-label="增加一组">＋</button>
    </div>
  );
}
