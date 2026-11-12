/**
 * 今日诗签 · 数据获取
 * 请求经 Worker 同源代理（GET /api/poetry/random，见 DEV.md §1.11）转发到
 * chinese-poetry-api 免费在线实例；上游失败/限流/超时回退到内置诗签，
 * 保证页面离线依旧完整可用（架构禁区例外，经用户同意）
 */

// 内置兜底诗签：经典短诗，离线/上游不可用时随机取一首
const FALLBACK_POEMS = [
  { title: '问刘十九', author: '白居易', dynasty: '唐', lines: ['绿蚁新醅酒，红泥小火炉。', '晚来天欲雪，能饮一杯无？'] },
  { title: '鹿柴', author: '王维', dynasty: '唐', lines: ['空山不见人，但闻人语响。', '返景入深林，复照青苔上。'] },
  { title: '江雪', author: '柳宗元', dynasty: '唐', lines: ['千山鸟飞绝，万径人踪灭。', '孤舟蓑笠翁，独钓寒江雪。'] },
  { title: '听弹琴', author: '刘长卿', dynasty: '唐', lines: ['泠泠七弦上，静听松风寒。', '古调虽自爱，今人多不弹。'] },
  { title: '送别', author: '王维', dynasty: '唐', lines: ['山中相送罢，日暮掩柴扉。', '春草明年绿，王孙归不归。'] },
];

/**
 * 取一首诗签；结构 { title, author, dynasty, lines: string[] }
 * 永不 reject：任何异常都回退内置诗
 * @returns {Promise<{title: string, author: string, dynasty: string, lines: string[]}>}
 */
export async function fetchPoem() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const resp = await fetch('/api/poetry/random', { signal: ctrl.signal });
    clearTimeout(timer);
    const json = await resp.json();
    if (json && json.ok && json.poem && Array.isArray(json.poem.lines)) {
      return json.poem;
    }
  } catch {
    // 静默回退
  }
  return FALLBACK_POEMS[Math.floor(Math.random() * FALLBACK_POEMS.length)];
}
