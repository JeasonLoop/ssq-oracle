import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Bookmark } from 'lucide-react';
import { listPicks, removePick, judgePick, algoLabel } from '../core/picks.js';
import { loadDraws } from '../core/history.js';
import Ball from '../components/Ball.jsx';

export default function PicksPage() {
  const [picks, setPicks] = useState(listPicks);
  const latest = useMemo(() => loadDraws()[0], []);

  function handleRemove(id) {
    setPicks(removePick(id));
  }

  return (
    <div>
      <section className="panel">
        <h2 className="panel-title">卦签夹 · 存号对奖</h2>
        {latest && (
          <div className="form-hint" style={{ marginBottom: 'calc(var(--space-unit) * 2)' }}>
            当前对比最新一期：{latest.issue} 期（{latest.date}）。更新开奖后回到本页即自动重新对奖。
          </div>
        )}

        {picks.length === 0 ? (
          <div className="empty-hint">
            <Bookmark size={28} />
            <p>签夹空空如也。去「号码生成」页推几组号码，点「入签夹」存到这里。</p>
            <Link className="btn-ghost" to="/generate">去推一卦</Link>
          </div>
        ) : (
          <div className="pick-list">
            {picks.map((p) => {
              const judge = latest ? judgePick(p, latest) : null;
              return (
                <div className="pick-card" key={p.id}>
                  <div className="ball-row">
                    {p.reds.map((n) => (
                      <span key={n} className={judge && judge.redHits.includes(n) ? 'hit-ball' : ''}>
                        <Ball n={n} color="red" />
                      </span>
                    ))}
                    <span className={judge && judge.blueHit ? 'hit-ball' : ''}>
                      <Ball n={p.blue} color="blue" />
                    </span>
                    <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => handleRemove(p.id)}>
                      <Trash2 size={14} /> 移出
                    </button>
                  </div>
                  <div className="pick-meta">
                    <span>{algoLabel(p.algo)} · 收于 {p.savedAt.slice(0, 10)}</span>
                    {judge && (
                      <span className="judge-line">
                        对比 {latest.issue} 期：中 {judge.redHits.length} 红{judge.blueHit ? ' + 1 蓝' : ' + 0 蓝'}
                        {judge.prize
                          ? <strong className="prize-tag"> 「{judge.prize}」</strong>
                          : ' · 未中奖'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="form-hint" style={{ marginTop: 'calc(var(--space-unit) * 2)' }}>
          对奖结果仅供娱乐参考，以官方开奖公告为准。卦签数据仅存于本地浏览器。
        </div>
      </section>
    </div>
  );
}
