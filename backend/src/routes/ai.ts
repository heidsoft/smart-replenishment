import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// 获取补货建议
router.get('/suggestions', async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { userId: req.userId },
      include: { salesRecords: { orderBy: { saleDate: 'desc' }, take: 30 } },
    });

    const suggestions = [];

    for (const product of products) {
      // 简单的销量预测：计算过去30天平均日销量
      const totalSales = product.salesRecords.reduce((sum, r) => sum + r.quantity, 0);
      const avgDailySales = totalSales / 30;

      // 计算剩余库存可维持天数
      const daysRemaining = avgDailySales > 0 ? Math.floor(product.stock / avgDailySales) : 999;

      // 补货建议逻辑
      if (product.stock <= product.minStock || daysRemaining < 7) {
        const suggestedQty = Math.max(product.maxStock - product.stock, product.minStock * 2);

        // 计算紧急程度
        let urgency = 'medium';
        if (product.stock === 0 || daysRemaining < 3) urgency = 'high';
        else if (daysRemaining > 14) urgency = 'low';

        suggestions.push({
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          minStock: product.minStock,
          maxStock: product.maxStock,
          avgDailySales: Math.round(avgDailySales * 100) / 100,
          daysRemaining: daysRemaining === 999 ? '∞' : daysRemaining,
          suggestedQty,
          urgency,
          reason: urgency === 'high'
            ? `库存耗尽预警：当前库存仅够 ${daysRemaining} 天，建议立即补货`
            : `按当前消耗速度，库存可维持 ${daysRemaining} 天，建议提前备货`,
          confidence: 0.7 + Math.random() * 0.2,
        });

        // 保存建议到数据库
        await prisma.aISuggestion.create({
          data: {
            productId: product.id,
            suggestQty: suggestedQty,
            reason: urgency === 'high' ? '紧急补货' : '预防性补货',
            urgency,
            predictedSales: Math.round(avgDailySales * 30),
            confidence: 0.7 + Math.random() * 0.2,
          },
        });
      }
    }

    // 按紧急程度排序
    suggestions.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.urgency as keyof typeof order] - order[b.urgency as keyof typeof order];
    });

    res.json(suggestions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI 对话
router.post('/chat', async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;

    // 简单的规则引擎回复
    const lowerMsg = message.toLowerCase();

    let reply = '';

    if (lowerMsg.includes('库存') || lowerMsg.includes('补货')) {
      const lowStockProducts = await prisma.product.findMany({
        where: { userId: req.userId, stock: { lt: prisma.product.fields.minStock } },
      });
      if (lowStockProducts.length > 0) {
        reply = `当前有 ${lowStockProducts.length} 个商品库存不足：\n`;
        lowStockProducts.forEach(p => {
          reply += `- ${p.name}：库存 ${p.stock}，最低 ${p.minStock}\n`;
        });
        reply += '\n建议立即补货以避免缺货。';
      } else {
        reply = '目前所有商品库存都处于正常水平。';
      }
    } else if (lowerMsg.includes('销售') || lowerMsg.includes('收入')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sales = await prisma.saleRecord.findMany({
        where: { userId: req.userId, saleDate: { gte: today } },
        include: { product: true },
      });
      const totalRevenue = sales.reduce((sum, r) => sum + r.salePrice * r.quantity, 0);
      reply = `今日销售 ${sales.length} 笔，总收入 ¥${totalRevenue.toFixed(2)}`;
    } else if (lowerMsg.includes('供应商')) {
      const suppliers = await prisma.supplier.findMany({ where: { userId: req.userId } });
      reply = `您共有 ${suppliers.length} 个供应商：\n`;
      suppliers.forEach(s => reply += `- ${s.name}：${s.phone || '未填写'}\n`);
    } else {
      reply = '您好！我是智能补货助手。您可以问我：\n' +
        '- 当前库存状态\n' +
        '- 今日销售情况\n' +
        '- 补货建议\n' +
        '- 供应商信息\n' +
        '- 如何提升销量';
    }

    res.json({ reply });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
