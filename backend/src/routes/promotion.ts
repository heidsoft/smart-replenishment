import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// 获取优惠券列表
router.get('/coupons', async (req: AuthRequest, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建优惠券
router.post('/coupons', async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, value, minAmount, validDays, totalCount } = req.body;

    const coupon = await prisma.coupon.create({
      data: {
        userId: req.userId!,
        name,
        type, // discount(折扣), cash(代金券), gift(赠品)
        value, // 折扣金额或折扣率
        minAmount: minAmount || 0, // 最低消费金额
        validDays: validDays || 30, // 有效期天数
        totalCount: totalCount || 100, // 发放总量
        usedCount: 0,
        status: 'active',
      },
    });
    res.json(coupon);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 领取优惠券
router.post('/coupons/:id/claim', async (req: AuthRequest, res: Response) => {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!coupon) {
      return res.status(404).json({ error: '优惠券不存在' });
    }

    if (coupon.usedCount >= coupon.totalCount) {
      return res.status(400).json({ error: '优惠券已领完' });
    }

    // 检查用户是否已领取
    const existing = await prisma.couponClaim.findFirst({
      where: {
        couponId: coupon.id,
        userId: req.userId,
      },
    });

    if (existing) {
      return res.status(400).json({ error: '已领取过该优惠券' });
    }

    // 领取
    const claim = await prisma.couponClaim.create({
      data: {
        couponId: coupon.id,
        userId: req.userId!,
        claimedAt: new Date(),
        expiredAt: new Date(Date.now() + coupon.validDays * 24 * 60 * 60 * 1000),
        status: 'unused',
      },
    });

    // 更新已领取数量
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });

    res.json(claim);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户已领取的优惠券
router.get('/my-coupons', async (req: AuthRequest, res: Response) => {
  try {
    const claims = await prisma.couponClaim.findMany({
      where: { userId: req.userId },
      include: { coupon: true },
      orderBy: { claimedAt: 'desc' },
    });
    res.json(claims);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 使用优惠券
router.post('/coupons/:id/use', async (req: AuthRequest, res: Response) => {
  try {
    const claim = await prisma.couponClaim.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.userId,
      },
      include: { coupon: true },
    });

    if (!claim) {
      return res.status(404).json({ error: '优惠券不存在' });
    }

    if (claim.status === 'used') {
      return res.status(400).json({ error: '优惠券已使用' });
    }

    if (new Date() > claim.expiredAt) {
      return res.status(400).json({ error: '优惠券已过期' });
    }

    // 更新为已使用
    await prisma.couponClaim.update({
      where: { id: claim.id },
      data: { status: 'used', usedAt: new Date() },
    });

    res.json({ message: '使用成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除优惠券
router.delete('/coupons/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.coupon.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
