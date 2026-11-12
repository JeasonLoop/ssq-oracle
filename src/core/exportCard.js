/**
 * 分享卡导出 · html2canvas 按需加载（约 45KB gz，不占首屏包体）
 * 两个入口共用：今日一卦页 / 生成页推演结果
 */

/**
 * 将节点渲染为 PNG 并触发下载
 * 画布底色取节点自身的背景色：透明底在查看器/聊天工具里会显示为白边，
 * 实色导出后圆角外补同色，观感干净
 * @param {HTMLElement} node 待导出节点
 * @param {string} filename 下载文件名（含 .png）
 */
export async function exportNodeAsPng(node, filename) {
  if (!node) return;
  const html2canvas = (await import('html2canvas')).default;
  // 读计算样式拿实际背景色（跟随明暗主题），兜底深色签筒底
  const computed = getComputedStyle(node).backgroundColor;
  const bg =
    computed && computed !== 'transparent' && computed !== 'rgba(0, 0, 0, 0)'
      ? computed
      : '#1f1915';
  const canvas = await html2canvas(node, {
    scale: 2, // 2 倍缩放保证清晰度
    backgroundColor: bg, // 实色底，消除透明区显示为白边的问题
    useCORS: true,
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
