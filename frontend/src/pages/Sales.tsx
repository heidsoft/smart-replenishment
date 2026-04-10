import { useState, useEffect } from 'react';
import { Card, Empty } from 'antd-mobile';
import { salesApi } from '../api';

export default function Sales() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string | undefined>();

  useEffect(() => {
    loadSales();
  }, [startDate]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      const data: any = await salesApi.list(params);
      setRecords(data);
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = records.reduce((sum, r) => sum + r.salePrice * r.quantity, 0);
  const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{ padding: '12px' }}>
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => setStartDate(e.target.value || undefined)}
          style={{ padding: '10px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '8px', width: '100%' }}
        />
        {startDate && (
          <p style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
            开始: {startDate}
            <span style={{ marginLeft: '12px', cursor: 'pointer', color: '#1677ff' }} onClick={() => setStartDate(undefined)}>清除</span>
          </p>
        )}
      </div>

      <Card style={{ margin: '0 12px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>¥{totalRevenue.toFixed(2)}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>总收入</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>{totalQuantity}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>总销量</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>{records.length}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>订单数</div>
          </div>
        </div>
      </Card>

      {records.length === 0 ? (
        <Empty description="暂无销售记录" />
      ) : (
        records.map((record) => (
          <Card key={record.id} style={{ margin: '0 12px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{record.product?.name}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>{new Date(record.saleDate).toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', color: '#52c41a' }}>¥{(record.salePrice * record.quantity).toFixed(2)}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>x{record.quantity} @ ¥{record.salePrice}</div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
