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
    const { message, use_llm } = req.body;

    // 获取用户上下文
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true, phone: true },
    });

    // 获取今日销售
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = await prisma.saleRecord.findMany({
      where: { userId: req.userId, saleDate: { gte: today } },
      include: { product: true },
    });

    // 获取库存不足商品
    const lowStockProducts = await prisma.product.findMany({
      where: { userId: req.userId },
    });

    // 获取供应商
    const suppliers = await prisma.supplier.findMany({
      where: { userId: req.userId },
    });

    // 如果启用 LLM
    if (use_llm) {
      try {
        const reply = await callLLM({
          message,
          user,
          todaySales,
          lowStockProducts,
          suppliers,
        });
        return res.json({ reply, mode: 'llm' });
      } catch (error: any) {
        console.error('LLM call failed:', error);
        // LLM 失败时回退到规则引擎
      }
    }

    // 规则引擎回复
    const lowerMsg = message.toLowerCase();
    let reply = '';

    if (lowerMsg.includes('库存') || lowerMsg.includes('补货') || lowerMsg.includes('缺货')) {
      const critical = lowStockProducts.filter(p => p.stock <= p.minStock);
      const warning = lowStockProducts.filter(p => p.stock > p.minStock && p.stock < p.minStock * 1.5);

      if (critical.length > 0) {
        reply = `⚠️ 发现 ${critical.length} 个商品库存告急：\n\n`;
        critical.forEach(p => {
          reply += `🔴 ${p.name}：库存 ${p.stock}，最低 ${p.minStock}\n`;
        });
        reply += '\n建议立即补货！';
      } else if (warning.length > 0) {
        reply = `📦 发现 ${warning.length} 个商品库存偏低：\n\n`;
        warning.forEach(p => {
          reply += `🟡 ${p.name}：库存 ${p.stock}，建议保持 ${p.minStock}\n`;
        });
      } else {
        reply = '✅ 目前所有商品库存都处于正常水平，继续保持！';
      }
    } else if (lowerMsg.includes('销售') || lowerMsg.includes('收入') || lowerMsg.includes('今天卖')) {
      const totalRevenue = todaySales.reduce((sum, r) => sum + r.salePrice * r.quantity, 0);
      const totalQty = todaySales.reduce((sum, r) => sum + r.quantity, 0);
      reply = `📊 今日销售概览：\n\n`;
      reply += `• 订单数：${todaySales.length} 笔\n`;
      reply += `• 商品销量：${totalQty} 件\n`;
      reply += `• 销售收入：¥${totalRevenue.toFixed(2)}\n\n`;

      if (todaySales.length > 0) {
        reply += '畅销商品：\n';
        const topProducts: any = {};
        todaySales.forEach(s => {
          const name = s.product.name;
          topProducts[name] = (topProducts[name] || 0) + s.quantity;
        });
        Object.entries(topProducts)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 3)
          .forEach(([name, qty]) => {
            reply += `• ${name}：${qty} 件\n`;
          });
      }
    } else if (lowerMsg.includes('供应商') || lowerMsg.includes('进货')) {
      reply = `🏪 您的供应商（${suppliers.length} 个）：\n\n`;
      suppliers.forEach(s => {
        reply += `📌 ${s.name}\n   联系人：${s.contact || '未填写'}\n   电话：${s.phone || '未填写'}\n\n`;
      });
    } else if (lowerMsg.includes('分析') || lowerMsg.includes('建议')) {
      const critical = lowStockProducts.filter(p => p.stock <= p.minStock);
      const revenue = todaySales.reduce((sum, r) => sum + r.salePrice * r.quantity, 0);

      reply = `📈 运营分析报告：\n\n`;
      reply += `**今日收入**：¥${revenue.toFixed(2)}\n`;
      reply += `**缺货预警**：${critical.length} 个商品\n`;
      reply += `**库存状态**：${lowStockProducts.filter(p => p.stock > p.minStock).length} 正常 / ${critical.length} 告急\n\n`;

      if (critical.length > 0) {
        reply += `💡 **建议**：优先处理缺货商品补货，避免影响销售。`;
      } else {
        reply += `💡 **建议**：库存充足，可持续关注销售数据优化备货策略。`;
      }
    } else if (lowerMsg.includes('帮助') || lowerMsg.includes('help')) {
      reply = `🤖 智能补货助手使用指南：\n\n` +
        `您可以问我：\n\n` +
        `📦 **库存相关**\n` +
        `• "库存还够吗"\n` +
        `• "哪些商品缺货"\n\n` +
        `💰 **销售相关**\n` +
        `• "今天卖了多少"\n` +
        `• "今日收入多少"\n\n` +
        `🏪 **供应商相关**\n` +
        `• "我的供应商有哪些"\n\n` +
        `📊 **分析建议**\n` +
        `• "给我一个分析报告"\n` +
        `• "有什么建议"`;
    } else {
      reply = `👋 您好${user?.name ? '，' + user.name : ''}！我是智能补货助手。\n\n` +
        `我可以帮您：\n` +
        `• 查看库存状态\n` +
        `• 分析销售数据\n` +
        `• 提供补货建议\n\n` +
        `请告诉我您想了解什么？`;
    }

    res.json({ reply, mode: 'rule' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 调用 LLM（可选）
async function callLLM(params: {
  message: string;
  user: any;
  todaySales: any[];
  lowStockProducts: any[];
  suppliers: any[];
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const systemPrompt = `你是一个专业的零售店铺智能补货助手，名叫"小补"。

你的能力：
- 分析库存状态，提供补货建议
- 分析销售数据，发现经营问题
- 回答关于店铺运营的问题

你的回答风格：
- 使用 emoji 增加可读性
- 中文回答，友好专业
- 重要数据用 **加粗**
- 结构化展示信息

当前商家信息：
- 商家名称：${params.user?.name || '未设置'}
- 联系电话：${params.user?.phone || '未设置'}

今日销售：${params.todaySales.length} 笔

库存状态：
- 总商品数：${params.lowStockProducts.length}
- 缺货/告急：${params.lowStockProducts.filter((p: any) => p.stock <= p.minStock).length}

供应商：${params.suppliers.length} 个`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: params.message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data: any = await response.json();
  return data.choices[0].message.content;
}

export default router;
