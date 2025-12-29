#!/bin/bash

# 完成 Git 配置和提交

echo "🔧 配置 Git 用户信息..."

# 设置 Git 用户信息（仅限此仓库）
git config user.email "weiyujia@example.com"
git config user.name "weiyujia"

echo "✅ Git 用户信息已配置"
echo ""
echo "📝 提交代码..."

# 提交代码
git commit -m "修复 API 路由 404 错误 - 添加所有缺失的 API 端点"

echo ""
echo "✅ 代码已提交！"
echo ""
echo "📋 下一步："
echo "1. 在 GitHub 创建新仓库（如果还没有）"
echo "2. 添加远程仓库并推送："
echo "   git remote add origin <你的GitHub仓库URL>"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. 然后在 Vercel 网站导入仓库进行部署"

