import { useState, useEffect } from 'react';
import { Card, Button, Tabs, Empty } from 'antd-mobile';
import { orderApi } from '../api';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = activeTab !== 'all' ? { status: activeTab } : undefined;
      const data: any = await orderApi.list(params);
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await orderApi.updateStatus(id, status, status === 'arrived' ? new Date().toISOString() : undefined);
      loadOrders();
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      pending: { color: '#faad14', text: '待发货' },
      shipped: { color: '#1677ff', text: '已发货' },
      arrived: { color: '#52c41a', text: '已到货' },
      cancelled: { color: '#999', text: '已取消' },
    };
    const item = map[status] || { color: '#999', text: status };
    return <div style={{ backgroundColor: item.color, color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{item.text}</div>;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as string)}>
        <Tabs.Tab title="全部" key="all" />
        <Tabs.Tab title="待发货" key="pending" />
        <Tabs.Tab title="已发货" key="shipped" />
        <Tabs.Tab title="已到货" key="arrived" />
      </Tabs>

      {orders.length === 0 ? (
        <Empty description="暂无订单" style={{ marginTop: '60px' }} />
      ) : (
        orders.map((order) => (
          <Card key={order.id} style={{ margin: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>{order.orderNo}</span>
              {getStatusBadge(order.status)}
            </div>

            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              供应商: {order.supplier?.name}
            </div>

            <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
              {order.items?.map((item: any) => (
                <span key={item.id}>{item.product?.name} x{item.quantity} | </span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', color: '#ff4d4f' }}>¥{order.totalAmount?.toFixed(2)}</span>
              <span style={{ fontSize: '12px', color: '#999' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>

            {order.status === 'pending' && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <Button size="small" color="danger" onClick={() => handleStatusChange(order.id, 'cancelled')}>
                  取消
                </Button>
                <Button size="small" color="primary" onClick={() => handleStatusChange(order.id, 'shipped')}>
                  确认发货
                </Button>
              </div>
            )}

            {order.status === 'shipped' && (
              <div style={{ marginTop: '8px' }}>
                <Button size="small" color="success" onClick={() => handleStatusChange(order.id, 'arrived')}>
                  确认到货
                </Button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
