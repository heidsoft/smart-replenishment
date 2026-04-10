import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// 获取销售记录
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { productId, startDate, endDate, memberId } = req.query;
    const where: any = { userId: req.userId };

    if (productId) where.productId = Number(productId);
    if (memberId) where.memberId = Number(memberId);
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate.gte = new Date(startDate as string);
      if (endDate) where.saleDate.lte = new Date(endDate as string);
    }

    const records = await prisma.saleRecord.findMany({
      where,
      include: { product: true, member: true },
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
    const { productId, quantity, salePrice, memberId } = req.body;

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

    // 计算赠送积分 (1元 = 1积分)
    const totalAmount = salePrice * quantity;
    const pointsEarned = Math.floor(totalAmount);

    // 更新会员积分和消费总额
    if (memberId) {
      await prisma.member.update({
        where: { id: memberId },
        data: {
          points: { increment: pointsEarned },
          totalSpent: { increment: totalAmount },
        },
      });
    }

    // 创建销售记录
    const record = await prisma.saleRecord.create({
      data: {
        productId,
        quantity,
        salePrice,
        userId: req.userId!,
        memberId: memberId || null,
      },
      include: { product: true, member: true },
    });
    res.json({ ...record, pointsEarned });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 批量收银 (收银台)
router.post('/checkout', async (req: AuthRequest, res: Response) => {
  try {
    const { items, memberId, discount, remark } = req.body;
    // items: [{ productId, quantity, salePrice }]
    const results = [];
    let totalAmount = 0;
    let totalPoints = 0;

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, userId: req.userId },
      });
      if (!product) continue;
      if (product.stock < item.quantity) {
        throw new Error(`${product.name} 库存不足，当前库存 ${product.stock}`);
      }

      // 扣减库存
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      const itemTotal = item.salePrice * item.quantity;
      totalAmount += itemTotal;
      totalPoints += Math.floor(itemTotal);

      const record = await prisma.saleRecord.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          salePrice: item.salePrice,
          userId: req.userId!,
          memberId: memberId || null,
        },
        include: { product: true },
      });
      results.push(record);
    }

    // 应用折扣
    let finalAmount = totalAmount;
    if (discount && discount > 0 && discount <= 1) {
      finalAmount = totalAmount * discount;
    }

    // 更新会员积分
    if (memberId) {
      const pointsEarned = Math.floor(finalAmount);
      await prisma.member.update({
        where: { id: memberId },
        data: {
          points: { increment: pointsEarned },
          totalSpent: { increment: finalAmount },
        },
      });
    }

    res.json({
      success: true,
      items: results,
      totalAmount,
      discount: discount || 1,
      finalAmount,
      pointsEarned: Math.floor(finalAmount),
      remark,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
