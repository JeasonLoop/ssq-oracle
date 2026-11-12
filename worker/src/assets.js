/**
 * 静态资源服务 · env.ASSETS 由 wrangler assets 配置注入
 * SPA fallback：未命中文件的路径回退到 index.html（前端路由接管）
 */

export async function getAsset(request, env, ctx) {
  const url = new URL(request.url);

  // 带扩展名的路径（如 /assets/xxx.js）未命中时直接 404，不回退
  const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(url.pathname);
  if (hasFileExtension) {
    return env.ASSETS.fetch(request);
  }

  // 先尝试原样取资源
  const assetResponse = await env.ASSETS.fetch(request);
  if (assetResponse.status !== 404) {
    return assetResponse;
  }

  // SPA fallback：交给 index.html，由前端路由（/generate /history /about）接管
  const indexUrl = new URL('/index.html', url.origin);
  return env.ASSETS.fetch(new Request(indexUrl, request));
}
