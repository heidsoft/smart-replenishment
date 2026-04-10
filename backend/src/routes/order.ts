import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

function generateOrderNo() {
  return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// 获取订单列表
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = { userId: req.userId };
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个订单
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: Number(req.params.id), userId: req.userId },
      include: { supplier: true, items: { include: { product: true } } },
    });
    if (!order) return res.status(404).json({ error: '订单不存在' });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建订单
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, items, expectedDate } = req.body;

    // 计算总金额
    let totalAmount = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) totalAmount += product.cost * item.quantity;
    }

    const order = await prisma.order.create({
      data: {
        orderNo: generateOrderNo(),
        totalAmount,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        status: 'pending',
        userId: req.userId!,
        supplierId,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price || 0,
          })),
        },
      },
      include: { supplier: true, items: { include: { product: true } } },
    });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新订单状态
router.put('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status, arrivedDate } = req.body;
    const order = await prisma.order.updateMany({
      where: { id: Number(req.params.id), userId: req.userId },
      data: {
        status,
        arrivedDate: arrivedDate ? new Date(arrivedDate) : undefined,
      },
    });
    if (order.count === 0) return res.status(404).json({ error: '订单不存在' });

    // 如果确认到货，自动入库
    if (status === 'arrived') {
      const fullOrder = await prisma.order.findUnique({
        where: { id: Number(req.params.id) },
        include: { items: true },
      });
      if (fullOrder) {
        for (const item of fullOrder.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    res.json(await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: { supplier: true, items: { include: { product: true } } },
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 取消订单
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.order.deleteMany({
      where: { id: Number(req.params.id), userId: req.userId, status: 'pending' },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
