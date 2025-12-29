#!/bin/bash

# 推送到 GitHub 仓库

echo "🚀 准备推送到 GitHub..."
echo ""

# 检查是否已配置远程仓库
if ! git remote get-url origin &> /dev/null; then
    echo "📝 添加远程仓库..."
    git remote add origin https://github.com/yvettewei-yj/stock-investment-test1.git
fi

# 确保在 main 分支
git branch -M main

echo "📤 推送到 GitHub..."
echo ""
echo "⚠️  注意：推送时需要输入 GitHub 用户名和密码（或 Personal Access Token）"
echo "   如果使用密码，GitHub 现在要求使用 Personal Access Token"
echo "   获取 Token: https://github.com/settings/tokens"
echo ""

# 推送到 GitHub
git push -u origin main

echo ""
echo "✅ 如果推送成功，代码已上传到 GitHub！"
echo ""
echo "📋 下一步："
echo "1. 访问 https://vercel.com"
echo "2. 点击 'New Project'"
echo "3. 导入仓库: yvettewei-yj/stock-investment-test1"
echo "4. Vercel 会自动部署"

