import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { List, Input, Button } from 'antd-mobile';
import { productApi, supplierApi } from '../api';

export default function AddProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '件',
    stock: 0,
    minStock: 10,
    maxStock: 100,
    price: 0,
    cost: 0,
    supplierId: undefined as number | undefined,
  });

  useEffect(() => {
    loadSuppliers();
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadSuppliers = async () => {
    try {
      const data: any = await supplierApi.list();
      setSuppliers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadProduct = async () => {
    try {
      const data: any = await productApi.get(Number(id));
      setForm({
        name: data.name,
        category: data.category || '',
        unit: data.unit,
        stock: data.stock,
        minStock: data.minStock,
        maxStock: data.maxStock,
        price: data.price,
        cost: data.cost,
        supplierId: data.supplierId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    if (!form.name) {
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await productApi.update(Number(id), form);
      } else {
        await productApi.create(form);
      }
      navigate('/products');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      <List header="基本信息">
        <List.Item>
          <Input
            placeholder="商品名称"
            value={form.name}
            onChange={(val) => setForm({ ...form, name: val })}
          />
        </List.Item>
        <List.Item>
          <Input
            placeholder="分类（可选）"
            value={form.category}
            onChange={(val) => setForm({ ...form, category: val })}
          />
        </List.Item>
        <List.Item>
          <Input
            placeholder="单位"
            value={form.unit}
            onChange={(val) => setForm({ ...form, unit: val })}
          />
        </List.Item>
      </List>

      <List header="库存设置" style={{ marginTop: '12px' }}>
        <List.Item extra={
          <Input type="number" value={String(form.stock)} onChange={(val) => setForm({ ...form, stock: parseInt(val) || 0 })} style={{ width: '80px' }} />
        }>
          当前库存
        </List.Item>
        <List.Item extra={
          <Input type="number" value={String(form.minStock)} onChange={(val) => setForm({ ...form, minStock: parseInt(val) || 0 })} style={{ width: '80px' }} />
        }>
          最低库存
        </List.Item>
        <List.Item extra={
          <Input type="number" value={String(form.maxStock)} onChange={(val) => setForm({ ...form, maxStock: parseInt(val) || 0 })} style={{ width: '80px' }} />
        }>
          最高库存
        </List.Item>
      </List>

      <List header="价格设置" style={{ marginTop: '12px' }}>
        <List.Item extra={
          <Input type="number" value={String(form.price)} onChange={(val) => setForm({ ...form, price: parseFloat(val) || 0 })} style={{ width: '80px' }} />
        }>
          售价
        </List.Item>
        <List.Item extra={
          <Input type="number" value={String(form.cost)} onChange={(val) => setForm({ ...form, cost: parseFloat(val) || 0 })} style={{ width: '80px' }} />
        }>
          成本价
        </List.Item>
      </List>

      <List header="供应商" style={{ marginTop: '12px' }}>
        <List.Item>
          <select
            value={form.supplierId || ''}
            onChange={(e) => setForm({ ...form, supplierId: e.target.value ? Number(e.target.value) : undefined })}
            style={{ width: '100%', padding: '8px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">请选择供应商</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </List.Item>
      </List>

      <Button block color="primary" size="large" loading={loading} onClick={handleSubmit} style={{ marginTop: '24px' }}>
        {isEdit ? '保存修改' : '创建商品'}
      </Button>
    </div>
  );
}
