# Vercel 部署指南

## ✅ 已完成

后端功能已迁移到 Vercel Serverless Functions，不再需要 Supabase Edge Functions。

## 📋 部署步骤

### 1. 将项目部署到 Vercel

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New Project**
3. 连接你的 GitHub 仓库
4. 配置项目：
   - **Framework Preset**: Vite
   - **Root Directory**: 保持默认（项目根目录）
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 点击 **Deploy**

### 2. 设置环境变量

在 Vercel 项目设置中添加环境变量：

1. 进入项目设置页面
2. 点击 **Environment Variables**
3. 添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `OPENROUTER_API_KEY` | 你的 OpenRouter API Key | 用于 AI 梦境分析 |

4. 点击 **Save**

### 3. 重新部署

设置环境变量后，需要重新部署项目：

1. 在 Vercel Dashboard 中，点击 **Deployments**
2. 找到最新的部署，点击 **Redeploy**
3. 或者推送代码到 GitHub，Vercel 会自动重新部署

## ✅ 验证部署

部署完成后，访问你的网站，进入"数据分析" → "关联分析"标签页，应该可以正常使用分析功能了。

## 📝 技术说明

- **API 函数位置**: `api/analyze-dream-patterns.ts`
- **前端调用**: `/api/analyze-dream-patterns`
- **依赖**: `@vercel/node` (已在 package.json 中添加)

## 🐛 故障排除

如果遇到错误：

1. **404 错误**: 确保项目已正确部署，API 函数文件位于 `api/` 目录
2. **500 错误**: 检查环境变量 `OPENROUTER_API_KEY` 是否正确设置
3. **CORS 错误**: Vercel Serverless Functions 自动处理 CORS，无需额外配置

## 📚 参考文档

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

