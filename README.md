# 智能补货助手 MVP 开发指南

## 📂 项目结构

```
smart-replenishment/
├── backend/
│   ├── src/
│   │   └── index.ts        # ✅ 主入口文件
│   ├── prisma/
│   │   └── schema.prisma   # ✅ 数据库模型
│   └── package.json        # ✅ 依赖配置
├── frontend/
│   └── prototype.html      # ✅ UI 原型
└── docs/
    └── README.md           # ✅ 项目文档
```

## ✅ 已完成

### A. 技术架构
- [x] 技术栈选型：Node.js + Express + SQLite
- [x] 项目结构设计
- [x] 环境配置

### B. 数据模型
- [x] Prisma Schema 设计
- [x] 10+ 核心数据表
- [x] 关系定义

### C. 原型设计
- [x] 移动端 UI 原型
- [x] 4 个核心页面
- [x] 交互逻辑

### D. 快速验证
- [x] 核心API 实现
- [x] 6 个主要接口
- [x] 内存数据库模拟

---

## 🚀 快速启动

```bash
cd /root/.openclaw/workspace/smart-replenishment/backend

# 安装依赖
npm install

# 启动服务
npm run dev
```

服务将运行在 http://localhost:3000

---

## 📡 API 列表

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/stats | GET | 首页统计 |
| /api/products | GET | 商品列表 |
| /api/products | POST | 添加商品 |
| /api/advice | GET | 补货建议 |
| /api/orders | GET | 订单列表 |
| /api/orders | POST | 创建订单 |
| /api/predict/:id | GET | 销量预测 |

---

**刘老师，MVP 开发框架已搭建完成！** 

接下来需要：
1. 部署测试环境
2. 连接真实数据库
3. 接入微信推送
4. 完善 AI 预测算法