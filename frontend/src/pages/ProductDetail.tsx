import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Popup, Input } from 'antd-mobile';
import { productApi, salesApi } from '../api';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSale, setShowSale] = useState(false);
  const [showStockIn, setShowStockIn] = useState(false);
  const [saleQty, setSaleQty] = useState(1);
  const [salePrice, setSalePrice] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data: any = await productApi.get(Number(id));
      setProduct(data);
      setSalePrice(data.price);
    } catch (error) {
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSale = async () => {
    try {
      await salesApi.create({ productId: product.id, quantity: saleQty, salePrice });
      setShowSale(false);
      loadProduct();
    } catch (error) {
      console.error(error);
    }
  };

  const handleStockIn = async (quantity: number) => {
    try {
      await productApi.stockIn(product.id, quantity);
      setShowStockIn(false);
      loadProduct();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  if (!product) return null;

  return (
    <div style={{ padding: '12px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 8px 0' }}>{product.name}</h2>
          <div style={{ display: 'inline-block', backgroundColor: product.stock <= product.minStock ? '#ff4d4f' : '#52c41a', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
            {product.stock <= product.minStock ? '库存不足' : '库存正常'}
          </div>
        </div>

        <div style={{ fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ color: '#999' }}>当前库存</span>
            <span>{product.stock} {product.unit}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ color: '#999' }}>最低库存</span>
            <span>{product.minStock} {product.unit}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ color: '#999' }}>最高库存</span>
            <span>{product.maxStock} {product.unit}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ color: '#999' }}>售价</span>
            <span style={{ color: '#52c41a' }}>¥{product.price}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ color: '#999' }}>成本价</span>
            <span>¥{product.cost}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ color: '#999' }}>供应商</span>
            <span>{product.supplier?.name || '未设置'}</span>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <Button color="success" style={{ flex: 1 }} onClick={() => setShowSale(true)}>
          销售
        </Button>
        <Button color="primary" style={{ flex: 1 }} onClick={() => setShowStockIn(true)}>
          入库
        </Button>
        <Button style={{ flex: 1 }} onClick={() => navigate(`/products/edit/${product.id}`)}>
          编辑
        </Button>
      </div>

      {/* 近期销售记录 */}
      {product.salesRecords?.length > 0 && (
        <Card style={{ marginTop: '12px' }}>
          <h4 style={{ marginBottom: '12px' }}>近期销售</h4>
          {product.salesRecords.slice(0, 5).map((record: any) => (
            <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <span>{new Date(record.saleDate).toLocaleDateString()}</span>
              <span>数量: {record.quantity}</span>
              <span style={{ color: '#52c41a' }}>¥{record.salePrice}</span>
            </div>
          ))}
        </Card>
      )}

      {/* 销售弹窗 */}
      <Popup visible={showSale} onClose={() => setShowSale(false)}>
        <div style={{ padding: '16px' }}>
          <h4 style={{ margin: '0 0 16px 0' }}>记录销售</h4>
          <div style={{ marginBottom: '12px' }}>
            <span>销售数量：</span>
            <Input type="number" value={String(saleQty)} onChange={(val) => setSaleQty(parseInt(val) || 1)} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span>销售单价：</span>
            <Input type="number" value={String(salePrice)} onChange={(val) => setSalePrice(parseFloat(val) || 0)} />
          </div>
          <div style={{ marginTop: '12px', color: '#999' }}>
            库存剩余: {product.stock - saleQty} | 收入: ¥{(saleQty * salePrice).toFixed(2)}
          </div>
          <Button block color="primary" onClick={handleSale} style={{ marginTop: '16px' }}>
            确认
          </Button>
        </div>
      </Popup>

      {/* 入库弹窗 */}
      <Popup visible={showStockIn} onClose={() => setShowStockIn(false)}>
        <div style={{ padding: '16px' }}>
          <h4 style={{ margin: '0 0 16px 0' }}>商品入库</h4>
          <p>当前库存: {product.stock} {product.unit}</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
            <Button onClick={() => handleStockIn(10)}>+10</Button>
            <Button onClick={() => handleStockIn(50)}>+50</Button>
            <Button onClick={() => handleStockIn(100)}>+100</Button>
          </div>
        </div>
      </Popup>
    </div>
  );
}
