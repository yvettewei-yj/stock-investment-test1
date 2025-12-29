#!/bin/bash

# 部署脚本：将修复后的代码部署到 Vercel

echo "🚀 开始部署到 Vercel..."

# 检查是否在正确的目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 方法 1: 使用 Vercel CLI（如果已安装）
if command -v vercel &> /dev/null; then
    echo "📦 使用 Vercel CLI 部署..."
    vercel --prod
    exit 0
fi

# 方法 2: 初始化 Git 并推送到 GitHub
echo "📝 初始化 Git 仓库..."
git init
git add .
git commit -m "修复 API 路由 404 错误 - 添加所有缺失的 API 端点"

echo ""
echo "✅ Git 仓库已初始化并提交"
echo ""
echo "📋 下一步操作："
echo "1. 将代码推送到 GitHub/GitLab："
echo "   git remote add origin <你的仓库URL>"
echo "   git push -u origin main"
echo ""
echo "2. 在 Vercel 网站 (https://vercel.com) 中："
echo "   - 点击 'New Project'"
echo "   - 导入你的 Git 仓库"
echo "   - Vercel 会自动检测并部署"
echo ""
echo "或者安装 Vercel CLI 后直接部署："
echo "   npm i -g vercel"
echo "   vercel --prod"

