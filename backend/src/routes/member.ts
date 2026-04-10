import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// 获取会员列表
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { keyword, level } = req.query;
    const where: any = { userId: req.userId };

    if (keyword) {
      where.OR = [
        { phone: { contains: keyword as string } },
        { name: { contains: keyword as string } },
      ];
    }
    if (level) {
      where.level = level;
    }

    const members = await prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(members);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个会员
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        records: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!member) {
      return res.status(404).json({ error: '会员不存在' });
    }
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建会员
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { phone, name, level, birthday, remark } = req.body;

    if (!phone) {
      return res.status(400).json({ error: '手机号不能为空' });
    }

    // 检查手机号是否已存在
    const existing = await prisma.member.findFirst({
      where: { userId: req.userId, phone },
    });
    if (existing) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    // 初始积分
    const initPoints = level === 'gold' ? 500 : level === 'silver' ? 200 : 0;

    const member = await prisma.member.create({
      data: {
        userId: req.userId,
        phone,
        name: name || '',
        level: level || 'normal',
        birthday: birthday ? new Date(birthday) : null,
        remark: remark || '',
        points: initPoints,
        totalSpent: 0,
      },
    });

    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新会员
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, level, birthday, remark } = req.body;
    const member = await prisma.member.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        level,
        birthday: birthday ? new Date(birthday) : undefined,
        remark,
      },
    });
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除会员
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.member.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 积分操作
router.post('/:id/points', async (req: AuthRequest, res: Response) => {
  try {
    const { type, points, remark } = req.body;
    const member = await prisma.member.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!member) {
      return res.status(404).json({ error: '会员不存在' });
    }

    let newPoints = member.points;
    if (type === 'add') {
      newPoints += points;
    } else if (type === 'deduct') {
      if (newPoints < points) {
        return res.status(400).json({ error: '积分不足' });
      }
      newPoints -= points;
    }

    // 更新积分
    await prisma.member.update({
      where: { id: parseInt(req.params.id) },
      data: { points: newPoints },
    });

    // 记录
    await prisma.memberPointRecord.create({
      data: {
        memberId: member.id,
        type,
        points,
        balance: newPoints,
        remark: remark || '',
      },
    });

    res.json({ points: newPoints });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 手机号查找会员
router.get('/phone/:phone', async (req: AuthRequest, res: Response) => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.userId, phone: req.params.phone },
    });
    res.json(member || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
