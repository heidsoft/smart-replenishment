import axios from 'axios';
import prisma from './db';

// AI 模型配置
const AI_CONFIG = {
  apiKey: process.env.AI_API_KEY || '',
  baseUrl: process.env.AI_BASE_URL || 'https://api.deepseek.com/v1',
  model: process.env.AI_MODEL || 'deepseek-chat',
};

/**
 * AI 对话补货
 */
export async function chatReplenishment(
  userId: string,
  shopId: string,
  message: string
): Promise<string> {
  const products = await prisma.product.findMany({
    where: { shopId, status: 1 },
    include: {
      sales: { orderBy: { saleTime: 'desc' }, take: 30 },
    },
  });
  
  const productContext = products
    .map(p => {
      const avgSales = p.sales.length > 0 
        ? (p.sales.reduce((sum, s) => sum + s.quantity, 0) / p.sales.length).toFixed(1)
        : '暂无数据';
      return `- ${p.name}: 库存${p.stock}${p.unit}, 日均销量${avgSales}`;
    })
    .join('\n');
  
  const systemPrompt = `你是智能补货助手，帮助小店老板管理库存。

当前商品信息：
${productContext}

回答要求：简洁友好，用数据说话，1-3句话。`;

  try {
    const response = await axios.post(
      `${AI_CONFIG.baseUrl}/chat/completions`,
      {
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error: any) {
    return fallbackReply(message, products);
  }
}

function fallbackReply(message: string, products: any[]): string {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('库存') || lowerMsg.includes('还有多少')) {
    const lowStock = products.filter(p => p.stock < p.minStock);
    if (lowStock.length === 0) return '所有商品库存充足~';
    return `有 ${lowStock.length} 个商品库存不足`;
  }
  
  if (lowerMsg.includes('补货') || lowerMsg.includes('进货')) {
    const needReplenish = products.filter(p => p.stock < p.minStock * 1.5).slice(0, 5);
    if (needReplenish.length === 0) return '库存充足，暂不需补货~';
    return `建议补货 ${needReplenish.length} 个商品`;
  }
  
  return '您好！可以问我：今天补什么货？XX还有多少库存？';
}

export async function predictSales(productId: string) {
  const sales = await prisma.saleRecord.findMany({
    where: { productId },
    orderBy: { saleTime: 'desc' },
    take: 30,
  });
  
  if (sales.length === 0) {
    return { avgDaily: 5, predict7Days: 35, confidence: 0.3, trend: 'stable' as const };
  }
  
  const avgDaily = sales.reduce((sum, s) => sum + s.quantity, 0) / sales.length;
  const confidence = Math.min(0.9, 0.5 + sales.length * 0.02);
  const predict7Days = Math.round(avgDaily * 7);
  
  return { avgDaily, predict7Days, confidence, trend: 'stable' as const };
}

export async function generateReplenishmentAdvice(shopId: string) {
  const products = await prisma.product.findMany({
    where: { shopId, status: 1 },
    include: { sales: { orderBy: { saleTime: 'desc' }, take: 30 } },
  });
  
  const advice = [];
  
  for (const product of products) {
    if (product.stock >= product.minStock * 1.5) continue;
    
    const avgSales = product.sales.length > 0
      ? product.sales.reduce((sum, s) => sum + s.quantity, 0) / product.sales.length
      : 5;
    
    const daysUntilStockout = product.stock / (avgSales || 1);
    const suggestQty = Math.max(Math.round(avgSales * 7 - product.stock), 0);
    
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (daysUntilStockout <= 2) priority = 'high';
    else if (daysUntilStockout <= 5) priority = 'medium';
    
    advice.push({
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      suggestQty,
      reason: product.stock === 0 ? '已断货！' : `预计${Math.ceil(daysUntilStockout)}天断货`,
      priority,
    });
  }
  
  return advice.sort((a, b) => ({ high: 0, medium: 1, low: 2 })[a.priority] - ({ high: 0, medium: 1, low: 2 })[b.priority]);
}