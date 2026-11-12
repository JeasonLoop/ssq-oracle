import { useMemo, useRef, useState } from 'react';
import { ALGOS, predict } from '../core/prediction/index.js';
import { recentDraws } from '../core/history.js';
import { validateLocks } from '../core/validate.js';
import GroupCountStepper from '../components/GroupCountStepper.jsx';
import LuckyEditor from '../components/LuckyEditor.jsx';
import OraclePanel from '../components/OraclePanel.jsx';
import Ball from '../components/Ball.jsx';

const PREFS_KEY = 'ssq-oracle.prefs.v1';
const EMPTY_LOCKS = { redLocks: [], blueLock: null, redExcludes: [], blueExcludes: [] };

/** 从 localStorage 恢复幸运号偏好 */
function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : EMPTY_LOCKS;
  } catch {
    return EMPTY_LOCKS;
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
  const [result, setResult] = useState(null);
  const [cooldownMsg, setCooldownMsg] = useState('');
  // 「一事一占」：记录最近点击时间，防连点
  const clickTimesRef = useRef([]);

  const locks = { redLocks, blueLock, redExcludes: [], blueExcludes: [] };
  const excludes = { redLocks: [], blueLock: null, redExcludes, blueExcludes };
  const errors = validateLocks(locks, excludes);

  /** 幸运号偏好持久化 */
  function persist() {
    savePrefs({ redLocks, blueLock, redExcludes, blueExcludes });
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
    };
    setResult(predict(algoKind, ctx, groupCount));
  }

  /** 一键复制该组号码 */
  function copyPick(pick) {
    const text = `${pick.reds.map((n) => String(n).padStart(2, '0')).join(' ')} + ${String(pick.blue).padStart(2, '0')}`;
    navigator.clipboard?.writeText(text).catch(() => {});
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

        <div style={{ marginTop: 'calc(var(--space-unit) * 3)', display: 'flex', alignItems: 'center', gap: 'calc(var(--space-unit) * 4)', flexWrap: 'wrap' }}>
          <GroupCountStepper value={groupCount} onChange={setGroupCount} />
          <button className="btn-primary" onClick={handleGenerate} disabled={errors.length > 0}>
            {algoKind === 'oracle' ? '起卦' : '推数'}
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
              清空
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

      {result && (
        <section className="panel">
          <h2 className="panel-title">推演结果</h2>
          <div className="pick-list">
            {result.groups.map((pick, i) => (
              <div className="pick-card" key={i} style={{ animationDelay: `${i * 130}ms` }}>
                <div className="ball-row">
                  {pick.reds.map((n) => <Ball key={n} n={n} color="red" />)}
                  <Ball n={pick.blue} color="blue" />
                  <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => copyPick(pick)}>
                    复制
                  </button>
                </div>
              </div>
            ))}
          </div>

          {result.reading && (
            <div style={{ marginTop: 'calc(var(--space-unit) * 4)' }}>
              <h3 className="panel-title">推演盘面</h3>
              <OraclePanel reading={result.reading} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
