import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, password, name } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { phone, password: hashedPassword, name },
    });

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, phone: user.phone, name: user.name } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password, code } = req.body;

    // 验证码登录（模拟）
    if (code === '123456') {
      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        return res.status(401).json({ error: '用户不存在' });
      }
      const token = generateToken(user.id);
      return res.json({ token, user: { id: user.id, phone: user.phone, name: user.name } });
    }

    // 密码登录
    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '密码错误' });
    }

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, phone: user.phone, name: user.name } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, phone: true, name: true, createdAt: true },
    });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
