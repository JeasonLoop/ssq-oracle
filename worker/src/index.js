/**
 * SSQ Oracle Worker 入口
 *
 * 架构：Worker 托管前端静态资源（SPA）+ 预留 /api/* 后端路由
 * 后续后端服务（如开奖数据接口、偏好云同步）直接在 handleApi 中扩展即可
 */

import { getAsset } from './assets.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 后端 API 路由：所有 /api/* 请求走这里（预留，后续服务在此扩展）
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
 *   GET /api/health       健康检查
 *   GET /api/draws        开奖数据（前端内置同源数据，此处供未来客户端动态拉取）
 * TODO（后续服务接入位）：
 *   POST /api/prefs       用户偏好云同步
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

  return Response.json(
    { ok: false, error: '未找到该接口', path: url.pathname },
    { status: 404, headers: cors }
  );
}
