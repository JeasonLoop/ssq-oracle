# SSQ Oracle · 双色球玄机台

一个**纯前端**的双色球娱乐预测平台。查看往期开奖号码（最近 45 期），用「数学期望」或「卦象推演」（小六壬 / 易经 / 五行 / 干支）生成 1–5 组号码，支持自定义幸运号锁定与排除。

> ⚠️ 本平台所有预测结果仅供娱乐，不构成任何购彩建议。彩票开奖为独立随机事件，任何算法都无法提高中奖概率。

## 文档导航

| 文档 | 内容 |
|---|---|
| [docs/DEV.md](docs/DEV.md) | 开发文档：产品需求、架构、算法规范、里程碑 |
| [docs/DESIGN.md](docs/DESIGN.md) | 样式设计：五个随机哈希码 → 设计令牌推导明细 |
| [AGENTS.md](AGENTS.md) | AI 协作规范：目录约定、编码规范、禁区 |

## 技术栈

- React 18 + JavaScript（JSX）+ Vite，不使用 TypeScript
- react-router-dom v6
- 无后端：开奖数据以本地 JSON 内置，算法全部在浏览器端运行
- 无 UI 框架依赖：样式基于 CSS 设计令牌（tokens.css），由五个随机哈希码派生

## 快速开始（待脚手架落地后）

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 生产构建
```

## 部署（Cloudflare Worker）

前端静态资源由 Worker 托管（SPA fallback），`/api/*` 预留后端路由：

```bash
npx wrangler deploy    # 构建并部署到 https://ssq-oracle.jeasonvan559.workers.dev
```

- 线上地址：https://ssq-oracle.jeasonvan559.workers.dev
- 健康检查：`GET /api/health`
- 后续后端服务：在 `worker/src/index.js` 的 `handleApi` 中扩展路由（见文件内 TODO）
- 仓库：https://github.com/JeasonLoop/ssq-oracle

## 哈希设计种子（生成于 2025，Windows PowerShell RNGCrypto）

```text
5fb3c944cfd71efe91618fc8eb2d20c5   赤文
b7d3e898e3e3f888e6625c00f8c752e3   素问
d54a0e528958f00a8f8d3922ea177d1e   玄墨
1a8213958ffdad536c19068ede6eccc7   靛青
561668683221ab89568a2f778ed0ddd6   衡尺
```

推导规则详见 [docs/DESIGN.md](docs/DESIGN.md)。
