/**
 * 卦象推演盘面 · 展示 oracle 算法的叙事产出
 * @param {{reading: import('../core/types.js').OracleReading}} props
 */
export default function OraclePanel({ reading }) {
  if (!reading) return null;
  const { ganzhi, liurenPalace, liurenMeaning, guaName, guaText, guaTemper, wuxingWeights, movingLine, changedGuaName } = reading;
  return (
    <div className="oracle-panel">
      <div className="oracle-gua">{guaName} · 动爻{['初', '二', '三', '四', '五', '上'][movingLine - 1]}</div>
      <div className="oracle-text" style={{ marginTop: 'calc(var(--space-unit) * 1)' }}>
        「{guaText}」—— 卦性{guaTemper}
        {changedGuaName ? `，变卦见 ${changedGuaName}` : ''}
      </div>
      <div style={{ marginTop: 'calc(var(--space-unit) * 2)' }}>
        干支：{ganzhi.year}年 {ganzhi.day}日 {ganzhi.hour}时
      </div>
      <div>
        小六壬落宫：<strong style={{ color: 'var(--gold)' }}>{liurenPalace}</strong>
      </div>
      <div className="oracle-text">{liurenMeaning}</div>
      <div style={{ marginTop: 'calc(var(--space-unit) * 2)' }}>
        五行旺衰：
        {wuxingWeights.map((w) => (
          <span key={w.element} style={{ marginLeft: 'calc(var(--space-unit) * 1.5)' }}>
            {w.element} ×{w.weight}
          </span>
        ))}
      </div>
      <div className="form-hint" style={{ marginTop: 'calc(var(--space-unit) * 2)' }}>
        以上盘面为算法叙事演绎，不构成任何真实预测。
      </div>
    </div>
  );
}
