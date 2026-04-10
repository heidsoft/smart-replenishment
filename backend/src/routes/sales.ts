import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// 获取销售记录
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { productId, startDate, endDate } = req.query;
    const where: any = { userId: req.userId };

    if (productId) where.productId = Number(productId);
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate.gte = new Date(startDate as string);
      if (endDate) where.saleDate.lte = new Date(endDate as string);
    }

    const records = await prisma.saleRecord.findMany({
      where,
      include: { product: true },
      orderBy: { saleDate: 'desc' },
      take: 100,
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 记录销售
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity, salePrice } = req.body;

    // 验证库存
    const product = await prisma.product.findFirst({
      where: { id: productId, userId: req.userId },
    });
    if (!product) return res.status(404).json({ error: '商品不存在' });
    if (product.stock < quantity) return res.status(400).json({ error: '库存不足' });

    // 扣减库存
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    // 创建销售记录
    const record = await prisma.saleRecord.create({
      data: {
        productId,
        quantity,
        salePrice,
        userId: req.userId!,
      },
      include: { product: true },
    });
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 批量录入销售
router.post('/batch', async (req: AuthRequest, res: Response) => {
  try {
    const { records } = req.body;
    const results = [];

    for (const item of records) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, userId: req.userId },
      });
      if (product && product.stock >= item.quantity) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        const record = await prisma.saleRecord.create({
          data: { ...item, userId: req.userId! },
          include: { product: true },
        });
        results.push(record);
      }
    }
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
