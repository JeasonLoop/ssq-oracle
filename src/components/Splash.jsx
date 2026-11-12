import { useEffect, useState } from 'react';

/**
 * 开屏动画 · 罗盘环旋转 + 标题渐显，约 2 秒后淡出
 * prefers-reduced-motion 用户由 CSS 自动隐藏（display:none），不阻塞进入
 * @param {{onDone: () => void}} props
 */
export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // 1500ms 开始淡出（时长 --dur-mid），2150ms 移除节点
    const t1 = setTimeout(() => setLeaving(true), 1500);
    const t2 = setTimeout(onDone, 2150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className={'splash' + (leaving ? ' leaving' : '')} aria-hidden="true">
      <div className="splash-ring">
        <span className="splash-seal">玄</span>
      </div>
      <div className="splash-title">双色球玄机台</div>
      <div className="splash-sub">── 推演仅供娱乐 · 理性购彩 ──</div>
    </div>
  );
}
