# API 修复说明

## 问题诊断

网站 `https://stock-investment-test.vercel.app/` 出现以下错误：

1. **404 错误**：多个 API 端点返回 404
   - `/api/stocks` - 股票数据
   - `/api/streak/status` - 连胜状态
   - `/api/mascot/status` - 吉祥物状态
   - `/api/learning-map/generate` - 生成学习地图

2. **JSON 解析错误**：API 返回 HTML 错误页面而不是 JSON

## 解决方案

已创建以下 API 路由文件：

### 1. `/api/stocks.js`
- 返回 15 只股票的列表数据
- 包含股票名称、代码、描述、行业、投资风格、风险等级等信息

### 2. `/api/streak/status.js`
- 返回用户连胜状态
- 支持 `user_id` 查询参数

### 3. `/api/mascot/status.js`
- 返回用户吉祥物状态
- 支持 `user_id` 查询参数

### 4. `/api/learning-map/generate.js`
- 生成学习地图
- 接受 POST 请求，包含用户选择的股票列表
- 返回结构化的学习地图数据

## 文件结构

```
static/
├── api/
│   ├── stocks.js
│   ├── streak/
│   │   └── status.js
│   ├── mascot/
│   │   └── status.js
│   └── learning-map/
│       └── generate.js
├── package.json
├── vercel.json
├── index.html
├── app.js
└── style.css
```

## 部署步骤

1. **提交代码到 Git 仓库**
   ```bash
   cd ~/Desktop/static
   git init
   git add .
   git commit -m "添加 API 路由修复 404 错误"
   ```

2. **连接到 Vercel**
   - 访问 https://vercel.com
   - 导入你的 Git 仓库
   - Vercel 会自动检测并部署

3. **或者使用 Vercel CLI**
   ```bash
   npm i -g vercel
   cd ~/Desktop/static
   vercel
   ```

## 注意事项

- 所有 API 路由都使用 CommonJS 格式 (`module.exports`)
- 已添加 CORS 头以支持跨域请求
- API 返回的数据格式与前端 `app.js` 中的期望格式匹配
- 目前返回的是默认/示例数据，后续可以根据需要连接真实数据库

## 测试

部署后，可以测试以下端点：

- `GET /api/stocks` - 应该返回股票列表
- `GET /api/streak/status?user_id=1` - 应该返回连胜状态
- `GET /api/mascot/status?user_id=1` - 应该返回吉祥物状态
- `POST /api/learning-map/generate?user_id=1` - 应该返回学习地图

