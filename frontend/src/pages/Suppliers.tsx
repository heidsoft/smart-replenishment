import { useState, useEffect } from 'react';
import { Card, Button, Popup, Input, Empty } from 'antd-mobile';
import { supplierApi } from '../api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', phone: '', address: '' });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data: any = await supplierApi.list();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name) {
      return;
    }
    try {
      await supplierApi.create(form);
      setShowDialog(false);
      setForm({ name: '', contact: '', phone: '', address: '' });
      loadSuppliers();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  return (
    <div>
      <Button color="primary" onClick={() => setShowDialog(true)} style={{ margin: '12px' }}>
        + 添加供应商
      </Button>

      {suppliers.length === 0 ? (
        <Empty description="暂无供应商" />
      ) : (
        suppliers.map((supplier) => (
          <Card key={supplier.id} style={{ margin: '0 12px 8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>{supplier.name}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {supplier.contact && <div>联系人: {supplier.contact}</div>}
              {supplier.phone && <div>电话: {supplier.phone}</div>}
              {supplier.address && <div>地址: {supplier.address}</div>}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
              商品: {supplier._count?.products || 0} | 订单: {supplier._count?.orders || 0}
            </div>
          </Card>
        ))
      )}

      <Popup visible={showDialog} onClose={() => setShowDialog(false)}>
        <div style={{ padding: '16px' }}>
          <h4 style={{ margin: '0 0 16px 0' }}>添加供应商</h4>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ display: 'block', marginBottom: '4px' }}>名称 *</span>
            <Input placeholder="供应商名称" value={form.name} onChange={(val) => setForm({ ...form, name: val })} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ display: 'block', marginBottom: '4px' }}>联系人</span>
            <Input placeholder="联系人姓名" value={form.contact} onChange={(val) => setForm({ ...form, contact: val })} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ display: 'block', marginBottom: '4px' }}>电话</span>
            <Input placeholder="联系电话" value={form.phone} onChange={(val) => setForm({ ...form, phone: val })} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ display: 'block', marginBottom: '4px' }}>地址</span>
            <Input placeholder="供应商地址" value={form.address} onChange={(val) => setForm({ ...form, address: val })} />
          </div>
          <Button block color="primary" onClick={handleSubmit}>
            确认
          </Button>
        </div>
      </Popup>
    </div>
  );
}
