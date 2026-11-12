import { useMemo, useState } from 'react';
import { Search, Upload, Trash2 } from 'lucide-react';
import { recentDraws, countRed, parseDrawsText, importDraws, clearImportedDraws } from '../core/history.js';
import { pad2 } from '../core/validate.js';
import DrawCard from '../components/DrawCard.jsx';
import FreqChart from '../components/FreqChart.jsx';

/**
 * 遗漏统计：从最旧往最新扫描，得到当前遗漏与窗口内最大遗漏
 * @param {import('../core/types.js').SSQDraw[]} draws 降序
 * @param {(draw: import('../core/types.js').SSQDraw, n: number) => boolean} isInDraw
 */
function omissionStats(draws, isInDraw) {
  const stats = {};
  for (let n = 1; n <= (isInDraw === isBlue ? 16 : 33); n++) {
    let cur = 0;
    let max = 0;
    for (let i = draws.length - 1; i >= 0; i--) {
      if (isInDraw(draws[i], n)) {
        cur = 0;
      } else {
        cur += 1;
        if (cur > max) max = cur;
      }
    }
    stats[n] = { cur, max };
  }
  return stats;
}

/** 红球命中判断（供遗漏统计复用） */
function isRed(draw, n) {
  return draw.reds.includes(n);
}

/** 蓝球命中判断 */
function isBlue(draw, n) {
  return draw.blue === n;
}

/** 遗漏值 → 分档样式：≥15 高遗漏描金，≥8 中等，其余常规 */
function omitLevel(cur) {
  if (cur >= 15) return 'is-high';
  if (cur >= 8) return 'is-mid';
  return '';
}

 export default function HistoryPage() {
   const [dataVersion, setDataVersion] = useState(0); // 导入/清空后 +1，强制刷新数据
   const draws = useMemo(() => recentDraws(45), [dataVersion]);
   const [keyword, setKeyword] = useState('');
   const [selectedRed, setSelectedRed] = useState(null);
   const [importText, setImportText] = useState('');
   const [importMsg, setImportMsg] = useState('');

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

  // 遗漏统计（红 1–33 / 蓝 1–16）
  const redOmit = useMemo(() => omissionStats(draws, isRed), [draws]);
  const blueOmit = useMemo(() => omissionStats(draws, isBlue), [draws]);

  // 和值走势（旧→新）与汇总统计
  const trend = useMemo(() => {
    const sums = draws.map((d) => d.reds.reduce((s, n) => s + n, 0)).reverse();
    const min = Math.min(...sums);
    const max = Math.max(...sums);
    const range = max - min || 1;
    const points = sums
      .map((s, i) => `${(i / (sums.length - 1)) * 100},${96 - ((s - min) / range) * 90}`)
      .join(' ');
    const avg = Math.round(sums.reduce((s, v) => s + v, 0) / sums.length);
    let odd = 0;
    let big = 0;
    let linkedDraws = 0;
    draws.forEach((d) => {
      d.reds.forEach((n) => {
        if (n % 2 === 1) odd += 1;
        if (n >= 17) big += 1;
      });
      if (d.reds.some((n, i) => i > 0 && n === d.reds[i - 1] + 1)) linkedDraws += 1;
    });
    return { points, avg, odd, big, linkedDraws, totalReds: draws.length * 6 };
  }, [draws]);

  /** 导入粘贴的开奖文本并合并 */
  function handleImport() {
    const { good, bad } = parseDrawsText(importText);
    if (good.length === 0) {
      setImportMsg(`没有可导入的记录${bad.length > 0 ? `，${bad.length} 行无法解析` : ''}`);
      return;
    }
     const added = importDraws(good);
     setDataVersion((v) => v + 1);
    setImportText('');
    setImportMsg(
      `已导入 ${added} 期` +
      (good.length - added > 0 ? `（${good.length - added} 期已存在，跳过）` : '') +
      (bad.length > 0 ? `；${bad.length} 行无效已忽略` : '')
    );
  }

  /** 清空本地导入记录，恢复内置数据 */
  function handleClearImport() {
     clearImportedDraws();
     setDataVersion((v) => v + 1);
    setImportMsg('已清空导入记录，恢复内置数据。');
  }

  return (
    <div>
      <section className="panel">
        <h2 className="panel-title">遗漏与走势（最近 45 期 · 数值为遗漏期数）</h2>

        <div className="freq-block">
          <div className="freq-title">红球当前遗漏 01–33（下为最大遗漏）</div>
          <div className="omit-grid">
            {Array.from({ length: 33 }, (_, i) => i + 1).map((n) => (
              <div key={n} className={`omit-cell ${omitLevel(redOmit[n].cur)}`}>
                <span className="omit-num">{pad2(n)}</span>
                <span className="omit-val">{redOmit[n].cur}</span>
                <span className="omit-max">{redOmit[n].max}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="freq-block">
          <div className="freq-title">蓝球当前遗漏 01–16（下为最大遗漏）</div>
          <div className="omit-grid">
            {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
              <div key={n} className={`omit-cell ${omitLevel(blueOmit[n].cur)}`}>
                <span className="omit-num">{pad2(n)}</span>
                <span className="omit-val">{blueOmit[n].cur}</span>
                <span className="omit-max">{blueOmit[n].max}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="freq-block">
          <div className="freq-title">红球和值走势（旧 → 新）</div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="sum-line">
            <polyline
              points={trend.points}
              fill="none"
              stroke="var(--gold)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="trend-summary">
          <span>平均和值 <strong>{trend.avg}</strong></span>
          <span>奇偶比 <strong>{trend.odd} : {trend.totalReds - trend.odd}</strong></span>
          <span>大小比 <strong>{trend.big} : {trend.totalReds - trend.big}</strong></span>
          <span>含连号 <strong>{trend.linkedDraws}</strong> / {draws.length} 期</span>
        </div>
      </section>

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
          <div className="search-box">
            <Search size={14} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索期号…"
            />
          </div>
        </div>
        <div className="history-list">
          {filtered.map((d) => (
            <DrawCard key={d.issue} draw={d} highlightReds={selectedRed ? [selectedRed] : []} />
          ))}
          {filtered.length === 0 && <div className="form-hint">没有匹配的期号</div>}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">本地导入开奖</h2>
        <p className="form-hint">
          每行一期：期号 日期 红×6 蓝（日期可缺省，空格 / 逗号分隔均可）。示例：
          2026130 2026-11-13 03 07 12 19 26 33 08。导入数据仅存本地浏览器，优先于内置数据。
        </p>
        <textarea
          className="import-area"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={4}
          placeholder={'2026130 2026-11-13 03 07 12 19 26 33 08\n2026131 2026-11-15 01 05 11 22 28 32 09'}
        />
        <div style={{ display: 'flex', gap: 'calc(var(--space-unit) * 2)', alignItems: 'center', marginTop: 'calc(var(--space-unit) * 2)' }}>
          <button className="btn-primary" onClick={handleImport} disabled={!importText.trim()}>
            <Upload size={15} /> 导入并合并
          </button>
          <button className="btn-ghost" onClick={handleClearImport}>
            <Trash2 size={14} /> 清空导入记录
          </button>
        </div>
        {importMsg && <div className="form-hint" style={{ marginTop: 'calc(var(--space-unit) * 1)' }}>{importMsg}</div>}
      </section>
    </div>
  );
}
