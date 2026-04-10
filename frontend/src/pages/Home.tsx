import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Grid, NoticeBar } from 'antd-mobile';
import { dashboardApi } from '../api';

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  return (
    <div style={{ padding: '12px' }}>
      {/* 低库存提醒 */}
      {stats?.lowStockProducts > 0 && (
        <NoticeBar
          color="alert"
          content={`有 ${stats.lowStockProducts} 个商品库存不足，点击查看补货建议`}
          onClick={() => navigate('/ai')}
          style={{ marginBottom: '12px', borderRadius: '8px' }}
        />
      )}

      {/* 统计卡片 */}
      <Grid columns={2} gap={12}>
        <Grid.Item>
          <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>¥{stats?.todayRevenue?.toFixed(0) || 0}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>今日收入</div>
            </div>
          </Card>
        </Grid.Item>
        <Grid.Item>
          <Card style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.todayOrders || 0}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>今日订单</div>
            </div>
          </Card>
        </Grid.Item>
        <Grid.Item>
          <Card style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>¥{stats?.monthRevenue?.toFixed(0) || 0}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>本月收入</div>
            </div>
          </Card>
        </Grid.Item>
        <Grid.Item>
          <Card style={{ background: stats?.pendingOrders > 0 ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.pendingOrders || 0}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>待处理订单</div>
            </div>
          </Card>
        </Grid.Item>
      </Grid>

      {/* 快捷入口 */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>快捷入口</h3>
        <Grid columns={4} gap={12}>
          <Grid.Item onClick={() => navigate('/products')}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>📦</div>
              <div style={{ fontSize: '12px', color: '#666' }}>商品</div>
            </div>
          </Grid.Item>
          <Grid.Item onClick={() => navigate('/orders')}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>📋</div>
              <div style={{ fontSize: '12px', color: '#666' }}>订单</div>
            </div>
          </Grid.Item>
          <Grid.Item onClick={() => navigate('/sales')}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>💰</div>
              <div style={{ fontSize: '12px', color: '#666' }}>销售</div>
            </div>
          </Grid.Item>
          <Grid.Item onClick={() => navigate('/ai')}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>🤖</div>
              <div style={{ fontSize: '12px', color: '#666' }}>AI助手</div>
            </div>
          </Grid.Item>
        </Grid>
      </div>

      {/* 低库存商品 */}
      {stats?.lowStockList?.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>⚠️ 库存预警</h3>
          {stats.lowStockList.map((product: any) => (
            <Card key={product.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>最低库存: {product.minStock}</div>
                </div>
                <div style={{ background: '#ff4d4f', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                  {product.stock}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 7天销售趋势 */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>📈 7天销售趋势</h3>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '100px' }}>
            {stats?.last7Days?.map((day: any, index: number) => {
              const maxRevenue = Math.max(...(stats?.last7Days?.map((d: any) => d.revenue) || [1]));
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 80 : 0;
              return (
                <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ height: `${height}px`, background: '#1677ff', borderRadius: '4px 4px 0 0', marginBottom: '4px', minHeight: day.revenue > 0 ? '2px' : '0' }} />
                  <div style={{ fontSize: '10px', color: '#999' }}>{day.date.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
