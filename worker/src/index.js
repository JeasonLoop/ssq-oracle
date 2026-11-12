/**
 * SSQ Oracle Worker 入口
 *
 * 架构：Worker 托管前端静态资源（SPA）+ /api/* 后端路由
 * 现有后端能力：健康检查、开奖数据预留位、诗签/黄历同源代理（DEV.md §1.11–§1.12）
 */

import { getAsset } from './assets.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 后端 API 路由：所有 /api/* 请求走这里
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, ctx);
    }

    // 其余走静态资源（assets 配置含 SPA fallback）
    return getAsset(request, env, ctx);
  },
};

/**
 * API 路由处理器
 * 现有路由：
 *   GET /api/health        健康检查
 *   GET /api/draws         开奖数据（前端内置同源数据，此处供未来客户端动态拉取）
 *   GET /api/poetry/random 诗签代理（chinese-poetry-api 免费在线实例）
 *   GET /api/almanac?sun=  黄历代理（36jxs 公益接口，aa1.cn 镜像兜底，按日缓存）
 * TODO（后续服务接入位）：
 *   POST /api/prefs        用户偏好云同步
 *   GET  /api/draws/latest 抓取最新开奖（需加缓存/限流再放开）
 * @param {Request} request
 * @param {Env} env
 * @param {ExecutionContext} ctx
 */
async function handleApi(request, env, ctx) {
  const url = new URL(request.url);
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (url.pathname === '/api/health' && request.method === 'GET') {
    return Response.json(
      { ok: true, service: 'ssq-oracle-worker', time: new Date().toISOString() },
      { headers: cors }
    );
  }

  if (url.pathname === '/api/draws' && request.method === 'GET') {
    // 静态开奖数据内置在前端 bundle 中；此路由为未来动态数据源预留
    return Response.json(
      { ok: true, note: 'draws 数据当前内置在前端，此接口为未来动态数据源预留', draws: [] },
      { headers: cors }
    );
  }

  if (url.pathname === '/api/poetry/random' && request.method === 'GET') {
    return proxyRandomPoem(cors);
  }

  if (url.pathname === '/api/almanac' && request.method === 'GET') {
     // sun 缺省时取 UTC 日期兜底（前端始终显式传本地日期）
     const sun = url.searchParams.get('sun') || new Date().toISOString().slice(0, 10);
     return proxyAlmanac(cors, sun, ctx, env);
  }

  return Response.json(
    { ok: false, error: '未找到该接口', path: url.pathname },
    { status: 404, headers: cors }
  );
}

/**
 * 诗签代理 · 转发到 chinese-poetry-api 免费在线实例（DEV.md §1.11）
 * 由 CF 边缘调用上游：用户网络不接触第三方域名，国内可达性与 CORS 均由代理解决
 */
const POETRY_UPSTREAM = 'https://poetry.palemoky.com/api/poems/random';
// 在线实例为旧版接口，仅 author 过滤可靠；轮换名家的作品保证签面质量
const POETRY_AUTHORS = ['李白', '杜甫', '王维', '李商隐', '白居易', '苏轼'];

/**
 * @param {Object} cors 共享 CORS 响应头
 * @returns {Promise<Response>}
 */
async function proxyRandomPoem(cors) {
  const author = POETRY_AUTHORS[Math.floor(Math.random() * POETRY_AUTHORS.length)];
  const upstream = `${POETRY_UPSTREAM}?author=${encodeURIComponent(author)}`;
  try {
    const resp = await fetch(upstream, { headers: { Accept: 'application/json' } });
    if (!resp.ok) throw new Error(`upstream ${resp.status}`);
    const json = await resp.json();
    const poem = json && json.data;
    if (!poem || !Array.isArray(poem.content) || poem.content.length === 0) {
      throw new Error('unexpected upstream payload');
    }
    return Response.json(
      {
        ok: true,
        poem: {
          title: poem.title || '无题',
          author: (poem.author && poem.author.name) || '佚名',
          dynasty: (poem.dynasty && poem.dynasty.name) || '',
          lines: poem.content,
        },
      },
      { headers: { ...cors, 'Cache-Control': 'no-store' } }
    );
  } catch {
    // 上游限流/不可达：返回 ok:false，前端回退内置诗签
    return Response.json({ ok: false, error: '诗签服务暂不可用' }, { headers: cors });
  }
}

 /**
  * 黄历代理 · 转发到 36jxs 公益老黄历接口（DEV.md §1.12）
  * 三上游 failover：36jxs → aa1.cn 镜像 → toolfk（需 token，未配置自动跳过）；
  * 黄历按天固定，边缘按日缓存减轻上游压力
  */
 const ALMANAC_UPSTREAMS = [
   (sun) => ({ url: `https://www.36jxs.com/api/Commonweal/almanac?sun=${encodeURIComponent(sun)}` }),
   (sun) => ({ url: `https://api.aa1.cn/api/almanac?sun=${encodeURIComponent(sun)}` }),
   // toolfk：token 从 Worker Secret 读（npx wrangler secret put TOOLFK_TOKEN）；
   // 其 https 证书 SNI 异常，只能走 http 明文
   (sun, env) => {
     if (!env || !env.TOOLFK_TOKEN) return null;
     return {
       shape: 'toolfk',
       url: `http://api.toolfk.com/api/lunar?time=${encodeURIComponent(sun)}&token=${encodeURIComponent(env.TOOLFK_TOKEN)}`,
     };
   },
 ];
 
 /**
  * toolfk 返回（中文键，{status:1, data:{...}}）→ 36jxs 形状（PascalCase）
  * 前端归一化零改动；字段口径见 DEV.md §1.12
  * @param {Object} d toolfk 原始 data 对象
  * @returns {Object|null}
  */
 function fromToolfk(d) {
   if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
   // 「每日宜忌」为合一字段："宜：A B C,忌：D E F" → 拆两段
   const both = String(d['每日宜忌'] || '');
   const yi = (both.match(/宜：([^,，]*)/) || [])[1] || '';
   const ji = (both.match(/忌：([^,，]*)/) || [])[1] || '';
   const year = String(d['年'] || ''); // "壬申年 属猴 剑锋金"
   const month = String(d['月'] || ''); // "癸卯月 属兔 金箔金"
   const day = String(d['日'] || ''); // "庚寅日 属虎 松柏木"
   const lunar = String(d['农历'] || ''); // "一九九二年 二月 十二 (阴历)"
   const lunarParts = lunar.replace('(阴历)', '').trim().split(/\s+/);
   // "庚寅日 属虎 松柏木" → 干支取首段去后缀，纳音取末段
   const gzOf = (s, suffix) => (s.split(' ')[0] || '').replace(suffix, '');
   const dayParts = day.split(' ');
   return {
     GregorianDateTime: String(d['公历'] || ''),
     LunarDateTime: lunar,
     LMonth: lunarParts[1] || '',
     LDay: lunarParts[2] || '',
     LYear: (year.match(/属(.+?)(\s|$)/) || [])[1] || '',
     Yi: yi,
     Ji: ji,
     Chong: String(d['相冲'] || ''),
     SuiSha: d['岁煞'] ? `岁煞${d['岁煞']}` : '',
     JianShen: String(d['值星'] || ''),
     PengZu: String(d['彭祖百忌'] || ''),
     ShenWei: [
       d['喜神方位'] && `喜神：${d['喜神方位']}`,
       d['福神方位'] && `福神：${d['福神方位']}`,
       d['财神方位'] && `财神：${d['财神方位']}`,
       d['贵神方位'] || '',
     ].filter(Boolean).join(' '),
     WuxingNaDay: dayParts.length >= 3 ? dayParts[2] : '',
     TianGanDiZhiYear: gzOf(year, '年'),
     TianGanDiZhiMonth: gzOf(month, '月'),
     TianGanDiZhiDay: gzOf(day, '日'),
     SolarTermName: String(d['物候'] || '').split(' ')[0] || '',
     GJie: '',
     LJie: '',
   };
 }
 
 /**
  * @param {Object} cors 共享 CORS 响应头
  * @param {string} sun 公历日期 YYYY-MM-DD
  * @param {ExecutionContext} ctx 用于 waitUntil 写缓存
  * @param {Env} env 读取可选 TOOLFK_TOKEN
  * @returns {Promise<Response>}
  */
 async function proxyAlmanac(cors, sun, ctx, env) {
   const cache = caches.default;
   const cacheKey = new Request(`https://cache.ssq-oracle.internal/almanac/${sun}`);
   const cached = await cache.match(cacheKey);
   if (cached) return cached;
 
   for (const buildSpec of ALMANAC_UPSTREAMS) {
     try {
       const spec = buildSpec(sun, env);
       if (!spec) continue;
       const resp = await fetch(spec.url, { headers: { Accept: 'application/json' } });
       if (!resp.ok) continue;
       const json = await resp.json();
       // toolfk：{status:1, data:{中文键}}，无 token 时 data 为空数组 → 归一化返回 null 自动跳过
       const data = spec.shape === 'toolfk' ? fromToolfk(json && json.data) : json && (json.data || json.Data);
       // 有效性检查：至少要有 宜 字段
       if (!data || (data.Yi === undefined && data.yi === undefined)) continue;
       const out = Response.json(
         { ok: true, sun, data },
         { headers: { ...cors, 'Cache-Control': 'public, max-age=21600' } }
       );
       ctx.waitUntil(cache.put(cacheKey, out.clone()));
       return out;
     } catch {
       // 尝试下一个上游
     }
   }
 
   // 全部上游故障：返回 ok:false，前端回退本地干支推演
   return Response.json({ ok: false, error: '黄历服务暂不可用' }, { headers: cors });
 }
