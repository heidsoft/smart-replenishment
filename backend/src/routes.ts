import { Request, Response } from 'express';
import prisma from './db';
import { generateReplenishmentAdvice, predictSales, chatReplenishment } from './ai';

// 商品列表
export async function getProducts(req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany({
      where: { shopId: req.shopId, status: 1 },
      include: { sales: { orderBy: { saleTime: 'desc' }, take: 7 } },
    });
    
    res.json(products.map(p => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      unit: p.unit,
      price: p.price,
      stock: p.stock,
      minStock: p.minStock,
      status: p.stock < p.minStock ? 'warning' : 'ok',
      avgSales: p.sales.length > 0 ? Math.round(p.sales.reduce((sum, s) => sum + s.quantity, 0) / p.sales.length * 10) / 10 : 0,
    })));
  } catch (error) {
    res.status(500).json({ error: '获取商品失败' });
  }
}

// 添加商品
export async function createProduct(req: Request, res: Response) {
  try {
    const product = await prisma.product.create({
      data: { shopId: req.shopId!, ...req.body, unit: req.body.unit || '件', minStock: req.body.minStock || 10 },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: '添加商品失败' });
  }
}

// 更新商品
export async function updateProduct(req: Request, res: Response) {
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: '更新商品失败' });
  }
}

// 删除商品
export async function deleteProduct(req: Request, res: Response) {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { status: 0 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除商品失败' });
  }
}

// 记录销售
export async function recordSale(req: Request, res: Response) {
  try {
    const { productId, quantity, price } = req.body;
    const sale = await prisma.saleRecord.create({ data: { productId, quantity, price } });
    await prisma.product.update({ where: { id: productId }, data: { stock: { decrement: quantity } } });
    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ error: '记录销售失败' });
  }
}

// 补货建议
export async function getAdvice(req: Request, res: Response) {
  try {
    res.json(await generateReplenishmentAdvice(req.shopId!));
  } catch (error) {
    res.status(500).json({ error: '获取补货建议失败' });
  }
}

// 销量预测
export async function getPrediction(req: Request, res: Response) {
  try {
    res.json(await predictSales(req.params.productId));
  } catch (error) {
    res.status(500).json({ error: '销量预测失败' });
  }
}

// 创建订单
export async function createOrder(req: Request, res: Response) {
  try {
    const { items, supplierId, remark } = req.body;
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0);
    const order = await prisma.order.create({
      data: {
        shopId: req.shopId!,
        supplierId,
        totalAmount,
        remark,
        items: { create: items.map((item: any) => ({ ...item })) },
      },
      include: { items: true },
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: '创建订单失败' });
  }
}

// 订单列表
export async function getOrders(req: Request, res: Response) {
  try {
    const orders = await prisma.order.findMany({
      where: { shopId: req.shopId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: '获取订单失败' });
  }
}

// 更新订单
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { items: true },
    });
    
    if (status === 2) {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: '更新订单失败' });
  }
}

// AI 对话
export async function chat(req: Request, res: Response) {
  try {
    const reply = await chatReplenishment(req.userId!, req.shopId!, req.body.message);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'AI 对话失败' });
  }
}

// 统计数据
export async function getStats(req: Request, res: Response) {
  try {
    const [totalProducts, lowStockCount, pendingOrders] = await Promise.all([
      prisma.product.count({ where: { shopId: req.shopId, status: 1 } }),
      prisma.product.count({ where: { shopId: req.shopId, status: 1, stock: { lt: 10 } } }),
      prisma.order.count({ where: { shopId: req.shopId, status: { in: [0, 1] } } }),
    ]);
    res.json({ totalProducts, lowStockCount, pendingOrders, lastUpdated: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: '获取统计失败' });
  }
}

// 供应商列表
export async function getSuppliers(req: Request, res: Response) {
  try {
    res.json(await prisma.supplier.findMany({ where: { shopId: req.shopId, status: 1 } }));
  } catch (error) {
    res.status(500).json({ error: '获取供应商失败' });
  }
}

// 添加供应商
export async function createSupplier(req: Request, res: Response) {
  try {
    const supplier = await prisma.supplier.create({ data: { shopId: req.shopId!, ...req.body } });
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: '添加供应商失败' });
  }
}