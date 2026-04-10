import { Router, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ==================== 快递公司管理 ====================

// 获取快递公司列表
router.get('/companies', async (req: AuthRequest, res: Response) => {
  try {
    const companies = await prisma.deliveryCompany.findMany({
      where: { userId: req.userId, enabled: true },
      orderBy: { name: 'asc' },
    });
    res.json(companies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建快递公司
router.post('/companies', async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, website, phone } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: '名称和代码不能为空' });
    }

    // 检查代码是否已存在
    const existing = await prisma.deliveryCompany.findFirst({
      where: { code, userId: req.userId },
    });
    if (existing) {
      return res.status(400).json({ error: '该快递代码已存在' });
    }

    const company = await prisma.deliveryCompany.create({
      data: { name, code, website, phone, userId: req.userId! },
    });
    res.json(company);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除快递公司
router.delete('/companies/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.deliveryCompany.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 发货管理 ====================

// 获取发货记录
router.get('/shipments', async (req: AuthRequest, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: { company: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(shipments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建发货记录
router.post('/shipments', async (req: AuthRequest, res: Response) => {
  try {
    const { orderNo, expressNo, companyId, receiverName, receiverPhone, receiverAddr } = req.body;

    if (!orderNo || !expressNo) {
      return res.status(400).json({ error: '订单号和快递单号不能为空' });
    }

    // 创建发货记录
    const shipment = await prisma.shipment.create({
      data: {
        orderNo,
        expressNo,
        companyId,
        receiverName,
        receiverPhone,
        receiverAddr,
        status: 'shipped',
        shippedAt: new Date(),
      },
      include: { company: true },
    });

    // 添加第一条轨迹
    await prisma.shipmentTrack.create({
      data: {
        shipmentId: shipment.id,
        status: '已发货',
        location: '商家发货地',
        time: new Date(),
      },
    });

    res.json(shipment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取物流轨迹
router.get('/shipments/:id/tracks', async (req: AuthRequest, res: Response) => {
  try {
    const tracks = await prisma.shipmentTrack.findMany({
      where: { shipmentId: parseInt(req.params.id) },
      orderBy: { time: 'desc' },
    });
    res.json(tracks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 模拟更新物流状态（实际应该调用快递公司API）
router.post('/shipments/:id/update', async (req: AuthRequest, res: Response) => {
  try {
    const { status, location, remark } = req.body;

    const shipment = await prisma.shipment.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });

    await prisma.shipmentTrack.create({
      data: {
        shipmentId: shipment.id,
        status,
        location,
        time: new Date(),
        remark,
      },
    });

    res.json({ message: '更新成功', shipment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 采购订单物流 ====================

// 更新订单物流信息
router.put('/orders/:id/logistics', async (req: AuthRequest, res: Response) => {
  try {
    const { trackingNumber, logisticsCompany, logisticsStatus } = req.body;

    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { trackingNumber, logisticsCompany, logisticsStatus },
    });

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取物流轨迹（模拟）
router.get('/orders/:id/track', async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!order || !order.trackingNumber) {
      return res.status(404).json({ error: '物流信息不存在' });
    }

    // 模拟物流轨迹
    const tracks = [
      { status: '已发货', location: '供应商仓库', time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { status: '运输中', location: '中转站', time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { status: '派送中', location: '当地配送网点', time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    ];

    res.json({
      trackingNumber: order.trackingNumber,
      company: order.logisticsCompany,
      status: order.logisticsStatus || '运输中',
      tracks,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 物流查询（聚合） ====================

// 查询快递100接口（需要配置key）
router.get('/query/:company/:expressNo', async (req: AuthRequest, res: Response) => {
  try {
    const { company, expressNo } = req.params;

    // 这里应该调用真实的快递100 API
    // 为了演示，返回模拟数据
    res.json({
      success: true,
      message: '模拟数据',
      data: {
        company,
        expressNo,
        status: '在途',
        tracks: [
          { time: '2026-04-10 10:00:00', location: '上海', status: '已发出' },
          { time: '2026-04-09 15:00:00', location: '上海', status: '揽收成功' },
        ],
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
