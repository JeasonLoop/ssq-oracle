import { useMemo, useState } from 'react';
import { recentDraws, countRed } from '../core/history.js';
import DrawCard from '../components/DrawCard.jsx';
import FreqChart from '../components/FreqChart.jsx';

export default function HistoryPage() {
  const draws = useMemo(() => recentDraws(45), []);
  const [keyword, setKeyword] = useState('');
  const [selectedRed, setSelectedRed] = useState(null);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return draws;
    return draws.filter((d) => d.issue.includes(keyword.trim()));
  }, [draws, keyword]);

  const selectedCount = selectedRed ? countRed(selectedRed, 45) : 0;

  // 45 期频次统计（图表与点选高亮共用一份数据）
  const redFreqOf = useMemo(() => {
    const freq = new Array(34).fill(0);
    draws.forEach((d) => d.reds.forEach((n) => { freq[n] += 1; }));
    return (n) => freq[n];
  }, [draws]);
  const blueFreqOf = useMemo(() => {
    const freq = new Array(17).fill(0);
    draws.forEach((d) => { freq[d.blue] += 1; });
    return (n) => freq[n];
  }, [draws]);

  return (
    <div>
      <section className="panel">
        <h2 className="panel-title">频次分布（最近 45 期 · 点选红柱联动下方高亮）</h2>
        <div className="freq-block">
          <div className="freq-title">红球 01–33</div>
          <FreqChart
            nums={Array.from({ length: 33 }, (_, i) => i + 1)}
            freqOf={redFreqOf}
            color="red"
            selected={selectedRed}
            onSelect={setSelectedRed}
          />
        </div>
        <div className="freq-block">
          <div className="freq-title">蓝球 01–16</div>
          <FreqChart
            nums={Array.from({ length: 16 }, (_, i) => i + 1)}
            freqOf={blueFreqOf}
            color="blue"
          />
        </div>
        {selectedRed && (
          <div className="form-hint" style={{ marginTop: 'calc(var(--space-unit) * 2)' }}>
            红球 {String(selectedRed).padStart(2, '0')} 在最近 45 期出现了 <strong style={{ color: 'var(--gold)' }}>{selectedCount}</strong> 次（下方含该号的期已高亮）
          </div>
        )}
      </section>

      <section className="panel">
        <div className="pick-header">
          <h2 className="panel-title" style={{ marginBottom: 0 }}>往期开奖（最近 45 期 · 真实数据）</h2>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索期号…"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--ink)',
              padding: 'calc(var(--space-unit) * 1) calc(var(--space-unit) * 2)',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <div className="history-list">
          {filtered.map((d) => (
            <DrawCard key={d.issue} draw={d} highlightReds={selectedRed ? [selectedRed] : []} />
          ))}
          {filtered.length === 0 && <div className="form-hint">没有匹配的期号</div>}
        </div>
      </section>
    </div>
  );
}
