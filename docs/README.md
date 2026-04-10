# 智能补货助手 - 项目文档

## 技术栈

### 后端
- **语言**: Node.js 18+ / TypeScript
- **框架**: Express.js
- **数据库**: SQLite (MVP) → PostgreSQL (生产)
- **缓存**: Redis
- **AI**: OpenAI API / 本地模型

### 前端
- **框架**: Vue 3 + Vite
- **UI**: Vant (移动端组件库)
- **状态管理**: Pinia

### 部署
- **容器化**: Docker
- **进程管理**: PM2

---

## 项目结构

```
smart-replenishment/
├── backend/
│   ├── src/
│   │   ├── controllers/    # API 控制器
│   │   ├── models/          # 数据模型
│   │   ├── services/        # 业务逻辑
│   │   ├── utils/           # 工具函数
│   │   └── index.ts         # 入口文件
│   ├── prisma/
│   │   └── schema.prisma    # 数据库模型
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   ├── components/      # 公共组件
│   │   ├── stores/          # 状态管理
│   │   └── App.vue
│   └── package.json
├── docs/
│   ├── api.md               # API 文档
│   └── deploy.md            # 部署文档
└── scripts/
    └── init-db.js           # 数据库初始化脚本
```

---

## 开发计划

### Phase 1: MVP (Week 1-2)
- [x] 技术架构设计
- [ ] 数据库模型设计
- [ ] 基础 API 开发
- [ ] 微信小程序前端

### Phase 2: 功能完善 (Week 3-4)
- [ ] AI 销量预测
- [ ] 微信消息推送
- [ ] 一键下单

### Phase 3: 优化迭代 (Week 5-6)
- [ ] AI 对话功能
- [ ] 性能优化
- [ ] 用户测试

---

## 环境变量

```bash
# .env
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-xxx
WECHAT_APPID=wx...
WECHAT_SECRET=xxx
```