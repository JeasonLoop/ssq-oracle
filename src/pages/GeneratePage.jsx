import { useMemo, useRef, useState } from 'react';
import { ALGOS, predict } from '../core/prediction/index.js';
import { recentDraws } from '../core/history.js';
import { validateLocks, pad2 } from '../core/validate.js';
import { addPick } from '../core/picks.js';
import GroupCountStepper from '../components/GroupCountStepper.jsx';
import LuckyEditor from '../components/LuckyEditor.jsx';
import OraclePanel from '../components/OraclePanel.jsx';
import Ball from '../components/Ball.jsx';
 import DatePicker from '../components/DatePicker.jsx';
 import { Sparkles, Copy, BookmarkPlus, Eraser, Share2, Download, X } from 'lucide-react';
 import ShareCard from '../components/ShareCard.jsx';
 import { exportNodeAsPng } from '../core/exportCard.js';
 import { dateKey } from '../core/fortune.js';

const PREFS_KEY = 'ssq-oracle.prefs.v1';
const EMPTY_LOCKS = { redLocks: [], blueLock: null, redExcludes: [], blueExcludes: [] };

/** 从 localStorage 恢复幸运号偏好与生日 */
function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { birth: '', ...JSON.parse(raw) } : { ...EMPTY_LOCKS, birth: '' };
  } catch {
    return { ...EMPTY_LOCKS, birth: '' };
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // 静默降级
  }
}

export default function GeneratePage() {
  const history = useMemo(() => recentDraws(45), []);
  const saved = useMemo(loadPrefs, []);

  const [algoKind, setAlgoKind] = useState('oracle');
  const [groupCount, setGroupCount] = useState(1);
  const [mode, setMode] = useState('lock'); // 幸运号编辑模式：锁定 / 排除
  const [redLocks, setRedLocks] = useState(saved.redLocks || []);
  const [blueLock, setBlueLock] = useState(saved.blueLock ?? null);
  const [redExcludes, setRedExcludes] = useState(saved.redExcludes || []);
  const [blueExcludes, setBlueExcludes] = useState(saved.blueExcludes || []);
  const [birth, setBirth] = useState(saved.birth || ''); // 命理盘生日
  const [dual, setDual] = useState(false); // 双盘对推开关
  const [result, setResult] = useState(null);
  const [savedKeys, setSavedKeys] = useState([]); // 已入签夹的号码标识
   const [cooldownMsg, setCooldownMsg] = useState('');
 
   // 分享卡：单盘分享当前算法结果；双盘对推分享卦象盘（含叙事）
   const [showShare, setShowShare] = useState(false);
   const [exporting, setExporting] = useState(false);
   const cardRef = useRef(null);
 
   /** 导出分享卡为图片（公共工具按需加载 html2canvas，失败静默降级） */
   async function exportCard() {
     if (!cardRef.current || exporting) return;
     setExporting(true);
     try {
       await exportNodeAsPng(cardRef.current, `ssq-oracle-${dateKey(new Date())}.png`);
     } catch {
       // 导出失败静默降级
     }
     setExporting(false);
   }
 
   const shareGroups = result ? (result.dual ? result.oracle.groups : result.groups) : [];
   const shareReading = result ? (result.dual ? result.oracle.reading : result.reading) : null;
   const shareAlgoTitle = result && !result.dual && !result.reading ? `${ALGOS[algoKind].label}推演` : '';
  // 「一事一占」：记录最近点击时间，防连点
  const clickTimesRef = useRef([]);

  const locks = { redLocks, blueLock, redExcludes: [], blueExcludes: [] };
  const excludes = { redLocks: [], blueLock: null, redExcludes, blueExcludes };
  const errors = validateLocks(locks, excludes);

  /** 幸运号偏好持久化（含命理盘生日） */
  function persist() {
    savePrefs({ redLocks, blueLock, redExcludes, blueExcludes, birth });
  }

  /** 红球点选：锁定模式 → 加入/移出锁定；排除模式 → 加入/移出排除 */
  function toggleRed(n) {
    if (mode === 'lock') {
      setRedLocks((prev) => {
        const next = prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n];
        // 锁定满 6 个或与排除重叠时自动从排除中移除，保持约束合法
        return next.length > 6 ? prev : next;
      });
      setRedExcludes((prev) => prev.filter((x) => x !== n));
    } else {
      setRedExcludes((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);
      setRedLocks((prev) => prev.filter((x) => x !== n));
    }
  }

  /** 蓝球点选：锁定最多 1 个（点击已锁定的取消），排除可多个 */
  function toggleBlue(n) {
    if (mode === 'lock') {
      setBlueLock((prev) => (prev === n ? null : n));
      setBlueExcludes((prev) => prev.filter((x) => x !== n));
    } else {
      setBlueExcludes((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);
      setBlueLock((prev) => (prev === n ? null : prev));
    }
  }

  /** 生成入口：「一事一占」冷却 + 约束校验 + 算法调度 */
  function handleGenerate() {
    persist();
    if (errors.length > 0) return;

    // 占卜实践趣味化：10 秒内连点 5 次 → 强制 3 秒冷静
    const now = Date.now();
    const recent = clickTimesRef.current.filter((t) => now - t < 10000);
    if (recent.length >= 4) {
      setCooldownMsg('心浮则卦乱，稍安勿躁……（3 秒）');
      setTimeout(() => setCooldownMsg(''), 3000);
      clickTimesRef.current = [];
      return;
    }
    clickTimesRef.current = [...recent, now];

    const ctx = {
      history,
      locks,
      excludes,
      now: new Date(),
      birth: birth || null,
    };
    if (dual) {
      // 双盘对推：两法同跑，各自独立抽样
      setResult({
        dual: true,
        math: predict('math', ctx, groupCount),
        oracle: predict('oracle', ctx, groupCount),
      });
    } else {
      setResult(predict(algoKind, ctx, groupCount));
    }
  }

  /** 一键复制该组号码 */
  function copyPick(pick) {
    const text = `${pick.reds.map((n) => String(n).padStart(2, '0')).join(' ')} + ${String(pick.blue).padStart(2, '0')}`;
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  /** 一组号码的唯一标识（入签夹去重/按钮态共用） */
  function pickKey(pick) {
    return `${pick.reds.join(',')}+${pick.blue}`;
  }

  /** 收入卦签夹 */
  function saveToPicks(pick, algo) {
    addPick(pick, algo);
    setSavedKeys((prev) => [...prev, pickKey(pick)]);
  }

  // 双盘对推：计算两盘共有的红/蓝球（描金高亮 + 汇总行）
  let dualShared = null;
  if (result && result.dual) {
    const mathReds = new Set(result.math.groups.flatMap((g) => g.reds));
    const oracleReds = new Set(result.oracle.groups.flatMap((g) => g.reds));
    const mathBlues = new Set(result.math.groups.map((g) => g.blue));
    const oracleBlues = new Set(result.oracle.groups.map((g) => g.blue));
    const redSet = new Set([...mathReds].filter((n) => oracleReds.has(n)));
    const blueSet = new Set([...mathBlues].filter((n) => oracleBlues.has(n)));
    dualShared = {
      redSet,
      blueSet,
      reds: [...redSet].sort((a, b) => a - b),
      blues: [...blueSet].sort((a, b) => a - b),
    };
  }

  /** 一组号码卡片（sharedReds/sharedBlues 传入时为双盘对推描金模式） */
  function renderPickCards(groups, algo, sharedReds, sharedBlues) {
    return groups.map((pick, i) => (
      <div className="pick-card" key={i} style={{ animationDelay: `${i * 130}ms` }}>
        <div className="ball-row">
          {pick.reds.map((n) => (
            <Ball key={n} n={n} color="red" dual={sharedReds ? sharedReds.has(n) : false} />
          ))}
          <Ball n={pick.blue} color="blue" dual={sharedBlues ? sharedBlues.has(pick.blue) : false} />
          <span className="pick-actions">
            <button className="btn-ghost" onClick={() => copyPick(pick)}>
              <Copy size={14} /> 复制
            </button>
            <button
              className="btn-ghost"
              onClick={() => saveToPicks(pick, algo)}
              disabled={savedKeys.includes(pickKey(pick))}
            >
              <BookmarkPlus size={14} /> {savedKeys.includes(pickKey(pick)) ? '已入签夹' : '入签夹'}
            </button>
          </span>
        </div>
      </div>
    ));
  }

  const algoList = Object.values(ALGOS);

  return (
    <div>
      <section className="panel">
        <h2 className="panel-title">推演之法</h2>
        <div className="algo-tabs">
          {algoList.map((a) => (
            <button
              key={a.key}
              className={'algo-tab' + (algoKind === a.key ? ' active' : '')}
              onClick={() => setAlgoKind(a.key)}
            >
              {a.label}
              <span className="form-hint" style={{ marginLeft: 'calc(var(--space-unit) * 1)' }}>{a.desc}</span>
            </button>
          ))}
        </div>

        {algoKind === 'destiny' && (
          <div className="birth-field">
             <span className="birth-label">生日：</span>
             <DatePicker value={birth} onChange={setBirth} />
            <span className="form-hint">命理盘以生日推灵数、生肖与星座；生日仅存本地浏览器。</span>
          </div>
        )}

        <div style={{ marginTop: 'calc(var(--space-unit) * 3)', display: 'flex', alignItems: 'center', gap: 'calc(var(--space-unit) * 4)', flexWrap: 'wrap' }}>
          <GroupCountStepper value={groupCount} onChange={setGroupCount} />
          <label className="dual-toggle">
            <input type="checkbox" checked={dual} onChange={(e) => setDual(e.target.checked)} />
            双盘对推（数学 × 卦象）
          </label>
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={errors.length > 0 || (algoKind === 'destiny' && !birth)}
          >
            <Sparkles size={16} />
            {dual ? '双盘对推' : algoKind === 'oracle' ? '起卦' : algoKind === 'destiny' ? '起盘' : '推数'}
          </button>
          {cooldownMsg && <span className="form-error">{cooldownMsg}</span>}
        </div>
        {errors.length > 0 && (
          <div className="form-error" style={{ marginTop: 'calc(var(--space-unit) * 2)' }}>
            {errors.map((e) => <div key={e}>⚠ {e}</div>)}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="pick-header">
          <h2 className="panel-title" style={{ marginBottom: 0 }}>幸运号</h2>
          <div className="mode-switch">
            <button className={'mode-btn' + (mode === 'lock' ? ' active' : '')} onClick={() => setMode('lock')}>锁定</button>
            <button className={'mode-btn' + (mode === 'exclude' ? ' active' : '')} onClick={() => setMode('exclude')}>排除</button>
            <button
              className="btn-ghost"
              onClick={() => { setRedLocks([]); setBlueLock(null); setRedExcludes([]); setBlueExcludes([]); }}
            >
              <Eraser size={14} /> 清空
            </button>
          </div>
        </div>
        <LuckyEditor
          redLocks={redLocks}
          blueLock={blueLock}
          redExcludes={redExcludes}
          blueExcludes={blueExcludes}
          mode={mode}
          onToggleRed={toggleRed}
          onToggleBlue={toggleBlue}
        />
      </section>

      {result && !result.dual && (
        <section className="panel">
          <div className="pick-header">
            <h2 className="panel-title">推演结果</h2>
            <button className="btn-ghost" onClick={() => setShowShare(true)}>
              <Share2 size={14} /> 分享卡
            </button>
          </div>
          <div className="pick-list">
            {renderPickCards(result.groups, algoKind, null, null)}
          </div>

          {result.reading && (
            <div style={{ marginTop: 'calc(var(--space-unit) * 4)' }}>
              <h3 className="panel-title">推演盘面</h3>
              <OraclePanel reading={result.reading} />
            </div>
          )}
        </section>
      )}

      {result && result.dual && dualShared && (
        <section className="panel">
          <div className="pick-header">
            <h2 className="panel-title">双盘对推</h2>
            <button className="btn-ghost" onClick={() => setShowShare(true)}>
              <Share2 size={14} /> 分享卡
            </button>
          </div>
          <div className="dual-summary">
            双法同断 ——
            {' '}红球：{dualShared.reds.length > 0 ? dualShared.reds.map((n) => pad2(n)).join(' ') : '——'}
            {' '}· 蓝球：{dualShared.blues.length > 0 ? dualShared.blues.map((n) => pad2(n)).join(' ') : '——'}
            <span className="form-hint">（描金球为两盘共有）</span>
          </div>
          <div className="dual-grid">
            <div>
              <h3 className="panel-title">数学盘</h3>
              <div className="pick-list">
                {renderPickCards(result.math.groups, 'math', dualShared.redSet, dualShared.blueSet)}
              </div>
            </div>
            <div>
               <h3 className="panel-title">卦象盘</h3>
               <div className="pick-list">
                 {renderPickCards(result.oracle.groups, 'oracle', dualShared.redSet, dualShared.blueSet)}
               </div>
             </div>
          </div>
          {result.oracle.reading && (
            <div style={{ marginTop: 'calc(var(--space-unit) * 4)' }}>
              <h3 className="panel-title">卦象盘面</h3>
              <OraclePanel reading={result.oracle.reading} />
            </div>
          )}
        </section>
      )}
      {showShare && result && (
        <div className="share-modal" onClick={() => setShowShare(false)}>
          <div className="share-modal-body" onClick={(e) => e.stopPropagation()}>
            <button className="share-close" onClick={() => setShowShare(false)} aria-label="关闭分享卡">
              <X size={16} />
            </button>
            <ShareCard
              kind="generate"
              date={dateKey(new Date())}
              groups={shareGroups}
              reading={shareReading}
              algoTitle={shareAlgoTitle}
              cardRef={cardRef}
            />
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
