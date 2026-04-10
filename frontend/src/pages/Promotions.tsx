import { useState, useEffect } from 'react';
import { Card, Empty, Button, Tabs, Toast } from 'antd-mobile';
import { promotionApi } from '../api';
import './Promotions.css';

export default function Promotions() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [myCoupons, setMyCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    value: 10,
    minAmount: 0,
    validDays: 30,
    totalCount: 100,
  });

  useEffect(() => {
    loadCoupons();
    loadMyCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const data: any = await promotionApi.listCoupons();
      setCoupons(data || []);
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCoupons = async () => {
    try {
      const data: any = await promotionApi.getMyCoupons();
      setMyCoupons(data || []);
    } catch (error) {
      console.error('Failed to load my coupons:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      Toast.show('请输入优惠券名称');
      return;
    }
    try {
      await promotionApi.createCoupon(formData);
      Toast.show('创建成功');
      setShowAddModal(false);
      loadCoupons();
    } catch (error: any) {
      Toast.show(error.response?.data?.error || '创建失败');
    }
  };

  const handleClaim = async (couponId: number) => {
    try {
      await promotionApi.claimCoupon(couponId);
      Toast.show('领取成功');
      loadMyCoupons();
      loadCoupons();
    } catch (error: any) {
      Toast.show(error.response?.data?.error || '领取失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该优惠券吗？')) return;
    try {
      await promotionApi.deleteCoupon(id);
      Toast.show('删除成功');
      loadCoupons();
    } catch (error) {
      Toast.show('删除失败');
    }
  };



  const getMyCouponStatus = (claim: any) => {
    if (claim.status === 'used') return '已使用';
    if (new Date() > new Date(claim.expiredAt)) return '已过期';
    return '可用';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN');
  };

  return (
    <div className="promotions-page">
      <Tabs defaultActiveKey="market">
        <Tabs.Tab title='优惠券市场' key='market'>
          <div className="section">
            <div className="section-header">
              <h3>发行优惠券</h3>
              <Button size='small' color='primary' onClick={() => setShowAddModal(true)}>
                + 创建优惠券
              </Button>
            </div>

            {loading ? (
              <div className="loading">加载中...</div>
            ) : coupons.length === 0 ? (
              <Empty description="暂无优惠券" />
            ) : (
              <div className="coupon-list">
                {coupons.map(coupon => (
                  <Card key={coupon.id} className="coupon-card">
                    <div className="coupon-content">
                      <div className="coupon-left">
                        <div className="coupon-value">
                          {coupon.type === 'cash' ? (
                            <><span className="yen">¥</span>{coupon.value}</>
                          ) : (
                            <>{coupon.value * 10}<span className="折">折</span></>
                          )}
                        </div>
                        <div className="coupon-condition">
                          {coupon.minAmount > 0 ? `满${coupon.minAmount}元可用` : '无门槛'}
                        </div>
                      </div>
                      <div className="coupon-right">
                        <div className="coupon-name">{coupon.name}</div>
                        <div className="coupon-info">
                          <span>有效期 {coupon.validDays} 天</span>
                          <span>已领 {coupon.usedCount}/{coupon.totalCount}</span>
                        </div>
                        <div className="coupon-actions">
                          <Button
                            size='small'
                            disabled={coupon.usedCount >= coupon.totalCount}
                            onClick={() => handleClaim(coupon.id)}
                          >
                            领取
                          </Button>
                          <Button
                            size='small'
                            color='danger'
                            onClick={() => handleDelete(coupon.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tabs.Tab>

        <Tabs.Tab title='我的优惠券' key='mine'>
          <div className="section">
            <div className="section-header">
              <h3>已领取优惠券</h3>
            </div>

            {myCoupons.length === 0 ? (
              <Empty description="暂无可用优惠券" />
            ) : (
              <div className="coupon-list">
                {myCoupons.map(claim => (
                  <Card key={claim.id} className={`coupon-card my-coupon ${claim.status === 'used' || new Date() > new Date(claim.expiredAt) ? 'expired' : ''}`}>
                    <div className="coupon-content">
                      <div className="coupon-left">
                        <div className="coupon-value">
                          {claim.coupon.type === 'cash' ? (
                            <><span className="yen">¥</span>{claim.coupon.value}</>
                          ) : (
                            <>{claim.coupon.value * 10}<span className="折">折</span></>
                          )}
                        </div>
                        <div className="coupon-condition">
                          {claim.coupon.minAmount > 0 ? `满${claim.coupon.minAmount}元可用` : '无门槛'}
                        </div>
                      </div>
                      <div className="coupon-right">
                        <div className="coupon-name">{claim.coupon.name}</div>
                        <div className="coupon-info">
                          <span>有效期至 {formatDate(claim.expiredAt)}</span>
                          <span className={`status ${getMyCouponStatus(claim)}`}>
                            {getMyCouponStatus(claim)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tabs.Tab>
      </Tabs>

      {/* Create Coupon Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>创建优惠券</span>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-item">
                <label>优惠券名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：新人专享券"
                />
              </div>
              <div className="form-item">
                <label>类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="cash">代金券</option>
                  <option value="discount">折扣券</option>
                </select>
              </div>
              <div className="form-item">
                <label>{formData.type === 'cash' ? '面额(元)' : '折扣率'}</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  placeholder={formData.type === 'cash' ? '例如：10' : '例如：0.9表示9折'}
                />
              </div>
              <div className="form-item">
                <label>最低消费(元)</label>
                <input
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0表示无门槛"
                />
              </div>
              <div className="form-item">
                <label>有效期(天)</label>
                <input
                  type="number"
                  value={formData.validDays}
                  onChange={(e) => setFormData({ ...formData, validDays: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="form-item">
                <label>发放数量</label>
                <input
                  type="number"
                  value={formData.totalCount}
                  onChange={(e) => setFormData({ ...formData, totalCount: parseInt(e.target.value) || 100 })}
                />
              </div>
              <Button block color='primary' onClick={handleCreate}>
                创建
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
