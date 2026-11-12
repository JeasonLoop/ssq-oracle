import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Palette, Check, X, Copy, BookmarkPlus, Flame, Feather, ScrollText, RefreshCw, Share2, Download } from 'lucide-react';
 import { getFortune, touchStreak, dateKey } from '../core/fortune.js';
import { addPick } from '../core/picks.js';
import { fetchPoem } from '../core/poetry.js';
import { fetchAlmanac } from '../core/almanac.js';
 import { exportNodeAsPng } from '../core/exportCard.js';
 import Ball from '../components/Ball.jsx';
 import ShareCard from '../components/ShareCard.jsx';

/** 签等 → 徽章样式类 */
const SIGN_LEVEL_CLASS = { 上签: 'is-good', 中签: 'is-mid', 平签: 'is-flat' };

export default function TodayPage() {
  // 到访时刻即「今日」；结果由日期种子决定，当天刷新不变
  const fortune = useMemo(() => getFortune(new Date()), []);
  const streak = useMemo(() => touchStreak(fortune.dateKey), [fortune]);
  const [saved, setSaved] = useState(false);

  // 诗签：进页面拉一次，上游不可用时 fetchPoem 内部回退内置诗
  const [poem, setPoem] = useState(null);
  const [poemLeaving, setPoemLeaving] = useState(false); // 换签淡出过渡
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPoem().then((p) => {
      if (alive) setPoem(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  /** 换一首：先淡出，拿到新诗再淡入；过渡期内防连点 */
  async function refreshPoem() {
    if (refreshing) return;
    setRefreshing(true);
    setPoemLeaving(true);
    const next = await fetchPoem();
    // 保底过渡时长，避免网络过快时闪烁
    setTimeout(() => {
      setPoem(next);
      setPoemLeaving(false);
      setRefreshing(false);
    }, 240);
  }

  // 黄历：失败返回 null，回退本地干支推演
  const [alm, setAlm] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchAlmanac(fortune.dateKey).then((a) => {
      if (alive) setAlm(a);
    });
    return () => {
      alive = false;
    };
  }, [fortune.dateKey]);

  // 分享卡：弹窗预览 + html2canvas 导出 PNG
  const [showShare, setShowShare] = useState(false);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef(null);

   /** 导出分享卡为图片（公共工具按需加载 html2canvas，失败静默降级） */
   async function exportCard() {
     if (!cardRef.current || exporting) return;
     setExporting(true);
     try {
       await exportNodeAsPng(cardRef.current, `ssq-oracle-${fortune.dateKey}.png`);
     } catch {
       // 导出失败静默降级（个别浏览器安全策略限制）
     }
     setExporting(false);
   }

  function copyPick() {
    const { reds, blue } = fortune.pick;
    const text = `${reds.map((n) => String(n).padStart(2, '0')).join(' ')} + ${String(blue).padStart(2, '0')}`;
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function savePick() {
    addPick(fortune.pick, 'oracle');
    setSaved(true);
  }

  return (
    <div>
      <section className="panel">
        <div className="pick-header">
          <h2 className="panel-title">今日一卦 · {fortune.dateKey}</h2>
          <span className="pick-header-actions">
            <button className="btn-ghost" onClick={() => setShowShare(true)}>
              <Share2 size={14} /> 分享卡
            </button>
            <span className="streak-badge"><Flame size={13} /> 已连签 {streak} 天</span>
          </span>
        </div>

        <div className="fortune-sign">
          <span className={`sign-badge ${SIGN_LEVEL_CLASS[fortune.sign.level]}`}>{fortune.sign.level}</span>
          <p className="oracle-text">{fortune.sign.text}</p>
          <div className="form-hint">
            干支：{fortune.ganzhi.year}年 {fortune.ganzhi.day}日
          </div>
        </div>

        <div className="today-grid">
          <div className="today-item">
            <Clock size={16} />
            <span>吉时：<strong>{fortune.luckyHour}</strong></span>
          </div>
          <div className="today-item">
            <Palette size={16} />
            <span>
              吉色：<span className="color-dot" style={{ background: fortune.luckyColor.token }} /> {fortune.luckyColor.name}
            </span>
          </div>
          <div className="today-item">
            <Check size={16} />
            <span>宜：{fortune.yi}</span>
          </div>
          <div className="today-item">
            <X size={16} />
            <span>忌：{fortune.ji}</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title"><ScrollText size={15} /> 今日黄历</h2>
        {alm ? (
          <div className="almanac-grid">
            <div>
              <span className="alm-key">农历</span>
              <span>
                {alm.lunar}（{alm.lunarAnimal}年）{alm.festival ? ` · ${alm.festival}` : ''}
              </span>
            </div>
            <div>
              <span className="alm-key">干支</span>
              <span>{alm.ganzhi}</span>
            </div>
            <div>
              <span className="alm-key">宜</span>
              <span>{alm.yi}</span>
            </div>
            <div>
              <span className="alm-key">忌</span>
              <span>{alm.ji}</span>
            </div>
            <div>
              <span className="alm-key">冲煞</span>
              <span>{[alm.chong, alm.suisha].filter(Boolean).join(' ')}</span>
            </div>
            <div>
              <span className="alm-key">建神</span>
              <span>{alm.jianshen}{alm.wuxingDay ? ` · 纳音 ${alm.wuxingDay}` : ''}</span>
            </div>
            {alm.shenwei && (
              <div>
                <span className="alm-key">吉神</span>
                <span>{alm.shenwei}</span>
              </div>
            )}
            {alm.pengzu && (
              <div>
                <span className="alm-key">彭祖</span>
                <span>{alm.pengzu}</span>
              </div>
            )}
            {alm.solarTerm && (
              <div>
                <span className="alm-key">节气</span>
                <span>{alm.solarTerm}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="almanac-grid">
            <div>
              <span className="alm-key">干支</span>
              <span>{fortune.ganzhi.year}年 {fortune.ganzhi.day}日</span>
            </div>
            <div>
              <span className="alm-key">吉时</span>
              <span>{fortune.luckyHour}</span>
            </div>
            <div>
              <span className="alm-key">宜</span>
              <span>{fortune.yi}</span>
            </div>
            <div>
              <span className="alm-key">忌</span>
              <span>{fortune.ji}</span>
            </div>
            <div className="form-hint">黄历服务暂歇，已切换本地干支推演</div>
          </div>
        )}
        <div className="form-hint" style={{ marginTop: 'calc(var(--space-unit) * 2)' }}>
          黄历数据来自公益接口，仅供娱乐参考。
        </div>
      </section>

      <section className="panel">
        <div className="pick-header">
          <h2 className="panel-title"><Feather size={15} /> 今日诗签</h2>
          <button className="btn-ghost poem-refresh" onClick={refreshPoem} disabled={refreshing}>
            <RefreshCw size={13} className={refreshing ? 'is-spinning' : ''} /> 换一首
          </button>
        </div>
        <div className={`poem-sign${poemLeaving ? ' is-leaving' : ''}`}>
          {poem ? (
            <>
              <p className="poem-lines">
                {poem.lines.map((line, i) => <span key={i}>{line}</span>)}
              </p>
              <div className="form-hint">
                —— {poem.dynasty}·{poem.author}《{poem.title}》
              </div>
            </>
          ) : (
            <div className="form-hint">诗签将至，稍候片刻……</div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">每日一签号码</h2>
        <div className="ball-row">
          {fortune.pick.reds.map((n) => <Ball key={n} n={n} color="red" />)}
          <Ball n={fortune.pick.blue} color="blue" />
          <span className="pick-actions">
            <button className="btn-ghost" onClick={copyPick}><Copy size={14} /> 复制</button>
            <button className="btn-ghost" onClick={savePick} disabled={saved}>
              <BookmarkPlus size={14} /> {saved ? '已入签夹' : '入签夹'}
            </button>
          </span>
        </div>
        <div className="form-hint" style={{ marginTop: 'calc(var(--space-unit) * 2)' }}>
          每日一签由当日日期种子决定，今日任何时间打开结果一致，明日自动更新。仅供娱乐。
        </div>
      </section>

      {showShare && (
        <div className="share-modal" onClick={() => setShowShare(false)}>
          <div className="share-modal-body" onClick={(e) => e.stopPropagation()}>
            <button className="share-close" onClick={() => setShowShare(false)} aria-label="关闭分享卡">
              <X size={16} />
            </button>
             <ShareCard kind="today" date={fortune.dateKey} fortune={fortune} poem={poem} alm={alm} cardRef={cardRef} />
            <div className="share-actions">
              <button className="btn-primary" onClick={exportCard} disabled={exporting}>
                <Download size={15} /> {exporting ? '生成中…' : '导出图片'}
              </button>
              <button className="btn-ghost" onClick={() => setShowShare(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
