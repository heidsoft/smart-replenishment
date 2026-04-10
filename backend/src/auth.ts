import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'smart-replenishment-secret-2026';

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      shopId?: string;
    }
  }
}

// 生成验证码（6位数字）
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 模拟短信验证码存储（生产环境用 Redis）
const smsCodes = new Map<string, { code: string; expires: number }>();

// 发送验证码
export async function sendSmsCode(phone: string): Promise<boolean> {
  const code = generateCode();
  smsCodes.set(phone, {
    code,
    expires: Date.now() + 5 * 60 * 1000, // 5分钟有效
  });
  
  // TODO: 接入真实短信服务
  console.log(`📱 验证码发送到 ${phone}: ${code}`);
  return true;
}

// 验证验证码
export function verifySmsCode(phone: string, code: string): boolean {
  // 开发环境：固定验证码 123456
  if (process.env.NODE_ENV !== 'production' && code === '123456') {
    return true;
  }
  
  const stored = smsCodes.get(phone);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    smsCodes.delete(phone);
    return false;
  }
  return stored.code === code;
}

// 生成 JWT Token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// 验证 JWT Token
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// 认证中间件
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token 无效' });
  }
  
  // 获取用户默认店铺
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { shops: { where: { status: 1 }, take: 1 } },
  });
  
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }
  
  req.userId = user.id;
  req.shopId = user.shops[0]?.id;
  
  next();
}

// 登录/注册
export async function loginOrRegister(phone: string, code: string) {
  if (!verifySmsCode(phone, code)) {
    throw new Error('验证码错误');
  }
  
  let user = await prisma.user.findUnique({ where: { phone } });
  
  if (!user) {
    // 自动注册
    user = await prisma.user.create({
      data: {
        phone,
        name: `用户${phone.slice(-4)}`,
      },
    });
    
    // 创建默认店铺
    await prisma.shop.create({
      data: {
        userId: user.id,
        name: '我的店铺',
      },
    });
  }
  
  return {
    user,
    token: generateToken(user.id),
  };
}