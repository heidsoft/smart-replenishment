import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, SearchBar, Button, Empty } from 'antd-mobile';
import { productApi } from '../api';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data: any = await productApi.list();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= minStock) return { color: '#ff4d4f', text: '低' };
    if (stock <= minStock * 3) return { color: '#faad14', text: '中' };
    return { color: '#52c41a', text: '高' };
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{ padding: '12px' }}>
        <SearchBar
          placeholder="搜索商品"
          value={search}
          onChange={(val) => setSearch(val)}
          style={{ '--background': '#f5f5f5' } as any}
        />
      </div>

      <Button
        color="primary"
        size="small"
        onClick={() => navigate('/products/add')}
        style={{ margin: '0 12px 12px' }}
      >
        + 添加商品
      </Button>

      {filteredProducts.length === 0 ? (
        <Empty description="暂无商品" />
      ) : (
        filteredProducts.map((product) => {
          const status = getStockStatus(product.stock, product.minStock);
          return (
            <Card
              key={product.id}
              onClick={() => navigate(`/products/${product.id}`)}
              style={{ margin: '0 12px 8px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{product.name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    库存: {product.stock} {product.unit} | 成本: ¥{product.cost}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    售价: ¥{product.price} | 供应商: {product.supplier?.name || '未设置'}
                  </div>
                </div>
                <div style={{ backgroundColor: status.color, color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                  {status.text}
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
