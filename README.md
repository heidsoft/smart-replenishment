# 智能补货助手

AI 驱动的零售补货解决方案，帮助小店老板轻松管理库存、补货提醒、销售分析。

## 功能特性

- 📦 **商品管理** - 添加/编辑/入库/库存预警
- 📋 **订单管理** - 采购订单、发货跟踪、到货确认
- 💰 **销售记录** - 快速录入销售、自动扣减库存
- 🤖 **AI 智能补货** - 基于销量的智能补货建议
- 📊 **数据看板** - 今日/本月收入、库存状态一览
- 💬 **AI 助手** - 自然语言查询库存/销售/供应商

## 技术栈

### 后端
- Node.js + Express + TypeScript
- Prisma ORM + SQLite
- JWT 认证

### 前端
- React 18 + Vite
- Ant Design Mobile
- React Router 6
- Zustand 状态管理

## 快速开始

### 后端启动

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

后端运行在 http://localhost:3000

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:5173

### 测试账号

- 手机号：13800138000
- 验证码：123456

## 项目结构

```
smart-replenishment/
├── backend/
│   ├── src/
│   │   ├── routes/      # API 路由
│   │   ├── middleware/  # 中间件
│   │   └── index.ts     # 入口
│   ├── prisma/
│   │   └── schema.prisma # 数据模型
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/         # API 调用
│   │   ├── pages/       # 页面组件
│   │   ├── stores/      # 状态管理
│   │   └── App.tsx      # 入口
│   └── package.json
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/register | 注册 |
| GET | /api/products | 商品列表 |
| POST | /api/products | 添加商品 |
| GET | /api/orders | 订单列表 |
| POST | /api/orders | 创建订单 |
| GET | /api/ai/suggestions | 补货建议 |
| POST | /api/ai/chat | AI 对话 |
| GET | /api/dashboard/stats | 仪表盘数据 |

## 部署

Docker 部署（待完善）：

```bash
docker build -t smart-replenishment .
docker run -p 3000:3000 -p 5173:5173 smart-replenishment
```

## License

MIT
