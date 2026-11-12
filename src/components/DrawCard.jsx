import Ball from './Ball.jsx';

/**
 * 单期开奖卡片 · 历史墙复用
 * @param {{draw: import('../core/types.js').SSQDraw, highlightReds?: number[]}} props
 * highlightReds：点选统计时高亮包含该号码的期
 */
export default function DrawCard({ draw, highlightReds = [] }) {
  const isHighlighted = highlightReds.length > 0 && highlightReds.every((n) => draw.reds.includes(n));
  return (
    <div
      className="draw-card"
      style={isHighlighted ? { borderColor: 'var(--gold)', transform: 'translateY(-2px)' } : undefined}
    >
      <div className="draw-meta">
        <div className="draw-issue">第 {draw.issue} 期</div>
        <div>{draw.date}</div>
      </div>
      <div className="ball-row">
        {draw.reds.map((n) => (
          <Ball key={n} n={n} color="red" />
        ))}
        <Ball n={draw.blue} color="blue" />
      </div>
    </div>
  );
}
