import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 路由处理函数
import { authMiddleware, sendSmsCode, loginOrRegister } from './auth';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  recordSale, getAdvice, getPrediction,
  createOrder, getOrders, updateOrderStatus,
  chat, getStats, getSuppliers, createSupplier
} from './routes';

// ==================== 公开接口 ====================

// 发送验证码
app.post('/api/auth/sms', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    await sendSmsCode(phone);
    res.json({ success: true, message: '验证码已发送' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 登录/注册
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    const result = await loginOrRegister(phone, code);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 微信绑定（暂未实现）
app.post('/api/auth/wechat', authMiddleware, async (req: Request, res: Response) => {
  res.json({ success: false, message: '微信绑定功能开发中' });
});

// ==================== 需要认证的接口 ====================

// 统计
app.get('/api/stats', authMiddleware, getStats);

// 商品管理
app.get('/api/products', authMiddleware, getProducts);
app.post('/api/products', authMiddleware, createProduct);
app.put('/api/products/:id', authMiddleware, updateProduct);
app.delete('/api/products/:id', authMiddleware, deleteProduct);

// 销售记录
app.post('/api/sales', authMiddleware, recordSale);

// 补货建议
app.get('/api/advice', authMiddleware, getAdvice);
app.get('/api/predict/:productId', authMiddleware, getPrediction);

// 订单管理
app.get('/api/orders', authMiddleware, getOrders);
app.post('/api/orders', authMiddleware, createOrder);
app.patch('/api/orders/:id', authMiddleware, updateOrderStatus);

// AI 对话
app.post('/api/chat', authMiddleware, chat);

// 供应商
app.get('/api/suppliers', authMiddleware, getSuppliers);
app.post('/api/suppliers', authMiddleware, createSupplier);

// ==================== 健康检查 ====================

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 智能补货助手 API 运行在 http://localhost:${PORT}`);
  console.log(`📖 API 文档: http://localhost:${PORT}/health`);
});