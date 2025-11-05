# Edge Function 部署指南

## 问题
如果看到错误消息："分析功能暂未配置，请确保Edge Function已部署"，说明 `analyze-dream-patterns` Edge Function 尚未部署到 Supabase。

## 部署方法

### 方法1：使用 Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目（project_id: ypvngooxhywipuzqpiev）
3. 进入 **Edge Functions** 页面
4. 点击 **Create a new function** 或 **Deploy**
5. 函数名称：`analyze-dream-patterns`
6. 将 `supabase/functions/analyze-dream-patterns/index.ts` 的内容复制到编辑器
7. 设置环境变量：
   - `OPENROUTER_API_KEY`：你的 OpenRouter API Key
8. 点击 **Deploy**

### 方法2：使用 Supabase CLI

1. 安装 Supabase CLI：
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # 或使用 npm
   npm install -g supabase
   ```

2. 登录 Supabase：
   ```bash
   supabase login
   ```

3. 链接项目：
   ```bash
   supabase link --project-ref ypvngooxhywipuzqpiev
   ```

4. 部署函数：
   ```bash
   supabase functions deploy analyze-dream-patterns
   ```

5. 设置环境变量（如果还没有设置）：
   ```bash
   supabase secrets set OPENROUTER_API_KEY=your_api_key_here
   ```

## 验证部署

部署成功后，关联分析功能应该可以正常工作了。

## 注意事项

- 确保 `OPENROUTER_API_KEY` 环境变量已正确设置
- 函数名称必须与代码中调用的一致：`analyze-dream-patterns`
- 部署后可能需要等待几秒钟才能生效

