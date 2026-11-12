import { QRCodeCanvas } from 'qrcode.react';
import Ball from './Ball.jsx';

const SIGN_LEVEL_CLASS = { 上签: 'is-good', 中签: 'is-mid', 平签: 'is-flat' };
const GROUP_NAMES = ['组一', '组二', '组三', '组四', '组五'];

/**
 * 分享卡 · 视觉摘要
 * kind='today'：今日一卦（号码 + 签文 + 黄历要点 + 诗签）
 * kind='generate'：推演结果（1–5 组号码 + 盘面叙事摘要）
 * 固定元素：站点二维码（qrcode.react，指向当前站点）+ 免责声明
 * 根节点经 html2canvas 导出 PNG
 * @param {{
 *   kind?: 'today'|'generate',
 *   date?: string,                       // 卡面日期 YYYY-MM-DD
 *   fortune?: Object,                    // today 模式：getFortune 产物
 *   poem?: Object|null,                  // today 模式：诗签
 *   alm?: Object|null,                   // today 模式：黄历
 *   groups?: import('../core/types.js').SSQPick[],  // generate 模式：号码组
 *   reading?: Object|null,               // generate 模式：盘面叙事
 *   algoTitle?: string,                  // generate 模式：无叙事时的算法名（如「数学期望推演」）
 *   cardRef: React.MutableRefObject,
 * }} props
 */
export default function ShareCard({
  kind = 'today',
  date,
  fortune,
  poem,
  alm,
  groups,
  reading,
  algoTitle,
  cardRef,
}) {
  // 二维码指向当前站点（生产环境即 ssq-predict.jeasonloop.online）
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="share-card" ref={cardRef}>
      <div className="sc-head">
        <span className="sc-brand">双色球玄机台 · {kind === 'generate' ? '推演结果' : '今日一卦'}</span>
        <span className="sc-date">{date}</span>
      </div>

      {kind === 'today' && fortune && (
        <>
          <div className="sc-sign">
            <span className={`sign-badge ${SIGN_LEVEL_CLASS[fortune.sign.level]}`}>{fortune.sign.level}</span>
            <span className="sc-sign-text">{fortune.sign.text}</span>
          </div>

          <div className="sc-nums">
            {fortune.pick.reds.map((n) => <Ball key={n} n={n} color="red" />)}
            <Ball n={fortune.pick.blue} color="blue" />
          </div>
          <div className="form-hint sc-nums-hint">今日一签号码</div>

          {alm && (
            <div className="sc-alm">
              <div>
                <span className="alm-key">农历</span>
                <span>{alm.lunar}（{alm.lunarAnimal}年）</span>
              </div>
              <div>
                <span className="alm-key">宜</span>
                <span>{alm.yi}</span>
              </div>
              <div>
                <span className="alm-key">忌</span>
                <span>{alm.ji}</span>
              </div>
            </div>
          )}
        </>
      )}

      {kind === 'generate' && groups && groups.length > 0 && (
        <div className="sc-groups">
          {groups.map((pick, i) => (
            <div className="sc-group" key={i}>
              <span className="sc-group-label">{GROUP_NAMES[i] || `组${i + 1}`}</span>
              <span className="sc-group-balls">
                {pick.reds.map((n) => <Ball key={n} n={n} color="red" />)}
                <Ball n={pick.blue} color="blue" />
              </span>
            </div>
          ))}
        </div>
      )}

      {kind === 'generate' && (reading || algoTitle) && (
        <div className="sc-reading">
          <div className="sc-reading-title">
            {reading ? reading.guaName : algoTitle}
            {reading && reading.movingLine ? ` · 动爻${['初', '二', '三', '四', '五', '上'][reading.movingLine - 1]}` : ''}
          </div>
          {reading && (
            <div className="form-hint">
              {reading.liurenPalace}{reading.guaText ? ` —— ${reading.guaText}` : ''}
            </div>
          )}
        </div>
      )}

      {kind === 'today' && poem && (
        <div className="sc-poem">
          <p className="poem-lines">
            {poem.lines.map((line, i) => <span key={i}>{line}</span>)}
          </p>
          <div className="form-hint">
            —— {poem.dynasty}·{poem.author}《{poem.title}》
          </div>
        </div>
      )}

      <div className="sc-foot">
        <div className="sc-qr">
          {/* Canvas 版二维码：html2canvas 导出时位图拷贝最可靠 */}
          <QRCodeCanvas value={siteUrl} size={76} marginSize={2} />
          <span className="form-hint">扫码进站</span>
        </div>
        <div className="sc-note">
          <span className="sc-brand-name">玄机台</span>
          <span className="form-hint">所有推演仅供娱乐，不构成任何购彩建议</span>
        </div>
      </div>
    </div>
  );
}
