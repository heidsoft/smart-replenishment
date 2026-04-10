import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// 仪表盘统计
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // 商品统计
    const totalProducts = await prisma.product.count({ where: { userId } });
    const lowStockProducts = await prisma.product.count({
      where: { userId, stock: { lt: prisma.product.fields.minStock } },
    });

    // 供应商统计
    const totalSuppliers = await prisma.supplier.count({ where: { userId } });

    // 今日销售
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = await prisma.saleRecord.findMany({
      where: { userId, saleDate: { gte: today } },
    });
    const todayRevenue = todaySales.reduce((sum, r) => sum + r.salePrice * r.quantity, 0);
    const todayOrders = todaySales.length;

    // 本月销售
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales = await prisma.saleRecord.findMany({
      where: { userId, saleDate: { gte: monthStart } },
    });
    const monthRevenue = monthSales.reduce((sum, r) => sum + r.salePrice * r.quantity, 0);

    // 待处理订单
    const pendingOrders = await prisma.order.count({
      where: { userId, status: 'pending' },
    });

    // 最近7天销量趋势
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySales = await prisma.saleRecord.findMany({
        where: {
          userId,
          saleDate: { gte: date, lt: nextDate },
        },
      });
      last7Days.push({
        date: date.toISOString().split('T')[0],
        orders: daySales.length,
        revenue: daySales.reduce((sum, r) => sum + r.salePrice * r.quantity, 0),
      });
    }

    // 低库存商品列表
    const lowStockList = await prisma.product.findMany({
      where: { userId, stock: { lt: prisma.product.fields.minStock } },
      take: 5,
    });

    res.json({
      totalProducts,
      lowStockProducts,
      totalSuppliers,
      todayRevenue,
      todayOrders,
      monthRevenue,
      pendingOrders,
      last7Days,
      lowStockList,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
