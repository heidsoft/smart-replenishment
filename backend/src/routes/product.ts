import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// 获取商品列表
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { category, lowStock } = req.query;
    const where: any = { userId: req.userId };

    if (category) where.category = category;
    if (lowStock === 'true') where.stock = { lt: (where.minStock || 10) };

    const products = await prisma.product.findMany({
      where,
      include: { supplier: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个商品
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: Number(req.params.id), userId: req.userId },
      include: {
        supplier: true,
        salesRecords: { orderBy: { saleDate: 'desc' }, take: 30 },
        aiSuggestions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!product) return res.status(404).json({ error: '商品不存在' });
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建商品
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, unit, stock, minStock, maxStock, price, cost, supplierId } = req.body;
    const product = await prisma.product.create({
      data: {
        name,
        category,
        unit: unit || '件',
        stock: stock || 0,
        minStock: minStock || 10,
        maxStock: maxStock || 100,
        price: price || 0,
        cost: cost || 0,
        supplierId,
        userId: req.userId!,
      },
      include: { supplier: true },
    });
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新商品
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, unit, stock, minStock, maxStock, price, cost, supplierId } = req.body;
    const product = await prisma.product.updateMany({
      where: { id: Number(req.params.id), userId: req.userId },
      data: { name, category, unit, stock, minStock, maxStock, price, cost, supplierId },
    });
    if (product.count === 0) return res.status(404).json({ error: '商品不存在' });
    const updated = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除商品
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.deleteMany({
      where: { id: Number(req.params.id), userId: req.userId },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 入库
router.post('/:id/stock-in', async (req: AuthRequest, res: Response) => {
  try {
    const { quantity } = req.body;
    const product = await prisma.product.updateMany({
      where: { id: Number(req.params.id), userId: req.userId },
      data: { stock: { increment: quantity } },
    });
    if (product.count === 0) return res.status(404).json({ error: '商品不存在' });
    const updated = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
