# 股票投资风格测试 - API 修复版

## 📋 修复内容

已修复所有 API 404 错误，添加了以下 API 端点：

- ✅ `/api/stocks` - 股票数据列表
- ✅ `/api/streak/status` - 连胜状态
- ✅ `/api/mascot/status` - 吉祥物状态  
- ✅ `/api/learning-map/generate` - 生成学习地图

## 🚀 部署到 Vercel

### 方法 1: 通过 Vercel 网站部署（推荐）

1. **准备 Git 仓库**
   ```bash
   cd ~/Desktop/static
   git init
   git add .
   git commit -m "修复 API 路由"
   ```

2. **推送到 GitHub/GitLab**
   - 在 GitHub 创建新仓库
   - 推送代码：
     ```bash
     git remote add origin <你的仓库URL>
     git branch -M main
     git push -u origin main
     ```

3. **在 Vercel 部署**
   - 访问 https://vercel.com
   - 点击 "New Project"
   - 导入你的 Git 仓库
   - Vercel 会自动检测并部署

### 方法 2: 使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
cd ~/Desktop/static
vercel --prod
```

### 方法 3: 使用部署脚本

```bash
cd ~/Desktop/static
./部署到Vercel.sh
```

## 📁 项目结构

```
static/
├── api/                    # API 路由
│   ├── stocks.js          # 股票数据
│   ├── streak/
│   │   └── status.js      # 连胜状态
│   ├── mascot/
│   │   └── status.js      # 吉祥物状态
│   └── learning-map/
│       └── generate.js    # 生成学习地图
├── index.html             # 主页面
├── app.js                 # 前端逻辑
├── style.css             # 样式文件
├── package.json          # 项目配置
├── vercel.json           # Vercel 配置
└── README.md            # 说明文档
```

## ✅ 测试 API

部署后，可以测试以下端点：

- `GET /api/stocks` - 返回股票列表
- `GET /api/streak/status?user_id=1` - 返回连胜状态
- `GET /api/mascot/status?user_id=1` - 返回吉祥物状态
- `POST /api/learning-map/generate?user_id=1` - 生成学习地图

## 🔧 技术栈

- 前端：HTML + JavaScript + Tailwind CSS
- 后端：Vercel Serverless Functions (Node.js)
- 部署：Vercel

## 📝 注意事项

- 所有 API 使用 CommonJS 格式
- 已添加 CORS 支持
- API 返回的数据格式与前端匹配
- 目前返回示例数据，后续可连接真实数据库

