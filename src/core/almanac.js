/**
 * 今日黄历 · 数据获取（DEV.md §1.12）
 * 请求经 Worker 同源代理（GET /api/almanac?sun=）转发到 36jxs 公益黄历接口，
 * Worker 侧双上游 failover + 按日边缘缓存；两上游均故障时返回 null，
 * 页面回退到本地干支引擎（wuxing.js）真实推演，不做假数据
 */

/**
 * 归一化上游 data（PascalCase 字段，见 DEV.md §1.12 返回示例）
 * @param {Object} d
 */
function normalizeAlmanac(d) {
  return {
    yangli: d.GregorianDateTime || '',
    lunar: [d.LMonth, d.LDay].filter(Boolean).join('') || d.LunarDateTime || '',
    lunarAnimal: d.LYear || '', // 生肖（鸡/蛇…）
    yi: d.Yi || d.yi || '',
    ji: d.Ji || d.ji || '',
    chong: d.Chong || '',
    suisha: d.SuiSha || '',
    jianshen: d.JianShen || '',
    pengzu: d.PengZu || '',
    shenwei: d.ShenWei || '',
    wuxingDay: d.WuxingNaDay || '',
    ganzhi: [d.TianGanDiZhiYear, d.TianGanDiZhiMonth, d.TianGanDiZhiDay]
      .filter(Boolean)
      .join(' '),
    solarTerm: d.SolarTermName || '',
    festival: d.GJie || d.LJie || '',
  };
}

/**
 * 取某日黄历；上游故障返回 null（页面回退本地推演），永不 reject
 * @param {string} sun 本地日期 YYYY-MM-DD
 * @returns {Promise<Object|null>}
 */
export async function fetchAlmanac(sun) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const resp = await fetch(`/api/almanac?sun=${encodeURIComponent(sun)}`, {
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const json = await resp.json();
    if (json && json.ok && json.data) return normalizeAlmanac(json.data);
  } catch {
    // 静默回退
  }
  return null;
}
