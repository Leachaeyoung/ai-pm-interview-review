# AI PM 面试复盘

AI 产品经理面试复盘与模拟面试工具。

## 功能

- **面试前**：上传 JD → AI 解析 → 生成针对性模拟题 → 全屏模拟面试
- **面试后**：记录真实面试题目、回答思路、复盘反思
- **复盘库**：时间线浏览所有面试记录，支持搜索和筛选
- **我的**：能力雷达图、薄弱环节分析、学习资源管理

## 开发

```bash
npm install
cp .env.local.example .env.local  # 编辑填入 ANTHROPIC_API_KEY
npm run dev
```

## 部署

环境变量：`ANTHROPIC_API_KEY`

```bash
vercel --env ANTHROPIC_API_KEY=your_key
```
