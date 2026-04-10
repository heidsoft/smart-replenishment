import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// 获取供应商列表
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { userId: req.userId },
      include: { _count: { select: { products: true, orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个供应商
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id: Number(req.params.id), userId: req.userId },
      include: { products: true },
    });
    if (!supplier) return res.status(404).json({ error: '供应商不存在' });
    res.json(supplier);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建供应商
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, contact, phone, address } = req.body;
    const supplier = await prisma.supplier.create({
      data: { name, contact, phone, address, userId: req.userId! },
    });
    res.json(supplier);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新供应商
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, contact, phone, address } = req.body;
    const supplier = await prisma.supplier.updateMany({
      where: { id: Number(req.params.id), userId: req.userId },
      data: { name, contact, phone, address },
    });
    if (supplier.count === 0) return res.status(404).json({ error: '供应商不存在' });
    res.json(await prisma.supplier.findUnique({ where: { id: Number(req.params.id) } }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除供应商
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.supplier.deleteMany({
      where: { id: Number(req.params.id), userId: req.userId },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
