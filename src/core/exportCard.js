/**
 * 分享卡导出 · html2canvas 按需加载（约 45KB gz，不占首屏包体）
 * 两个入口共用：今日一卦页 / 生成页推演结果
 */

/**
 * 将节点渲染为 PNG 并触发下载
 * @param {HTMLElement} node 待导出节点
 * @param {string} filename 下载文件名（含 .png）
 */
export async function exportNodeAsPng(node, filename) {
  if (!node) return;
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(node, {
    scale: 2, // 2 倍缩放保证清晰度
    backgroundColor: null, // 保留卡片圆角外的透明底
    useCORS: true,
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
