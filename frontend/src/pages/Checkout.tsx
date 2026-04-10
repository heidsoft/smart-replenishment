import { useState, useEffect } from 'react';
import { Toast, Empty } from 'antd-mobile';
import { productApi, salesApi, memberApi } from '../api';
import './Checkout.css';

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface MemberInfo {
  id: number;
  name: string;
  phone: string;
  level: string;
  points: number;
}

export default function Checkout() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [discount, setDiscount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data: any = await productApi.list();
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        Toast.show('库存不足');
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock: product.stock,
      }]);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ));
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalAmount = totalAmount * discount;
  const pointsEarned = Math.floor(finalAmount);

  const searchMember = async () => {
    if (!memberPhone.trim()) return;
    try {
      const data: any = await memberApi.findByPhone(memberPhone);
      if (data) {
        setMember(data);
        Toast.show('会员已找到');
      } else {
        Toast.show('会员不存在');
      }
    } catch (error) {
      Toast.show('查找失败');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Toast.show('请先添加商品');
      return;
    }

    setLoading(true);
    try {
      const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        salePrice: item.price,
      }));

      const result: any = await salesApi.checkout({
        items,
        memberId: member?.id,
        discount,
      });

      Toast.show({
        content: `收银成功！\n获得 ${result.pointsEarned} 积分`,
        duration: 3000,
      });

      // 清空购物车
      setCart([]);
      setMember(null);
      setMemberPhone('');
      setDiscount(1);
      setShowCart(false);

      // 刷新商品库存
      loadProducts();
    } catch (error: any) {
      Toast.show(error.response?.data?.error || '收银失败');
    } finally {
      setLoading(false);
    }
  };

  const getLevelName = (level: string) => {
    const map: any = { normal: '普通', silver: '银卡', gold: '金卡', diamond: '钻石' };
    return map[level] || '普通';
  };

  const getLevelColor = (level: string) => {
    const map: any = { normal: '#999', silver: '#C0C0C0', gold: '#FFD700', diamond: '#B9F2FF' };
    return map[level] || '#999';
  };

  return (
    <div className="checkout-page">
      {/* Header */}
      <div className="checkout-header">
        <div className="header-title">收银台</div>
        <div className="header-actions">
          <button className="btn-cart" onClick={() => setShowCart(!showCart)}>
            🛒 {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索商品..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      {/* Member Bar */}
      <div className="member-bar" onClick={() => setShowMemberSearch(true)}>
        {member ? (
          <div className="member-info">
            <span className="member-name">{member.name || '会员'}</span>
            <span className="member-phone">{member.phone}</span>
            <span className="member-level" style={{ color: getLevelColor(member.level) }}>
              {getLevelName(member.level)}
            </span>
            <span className="member-points">{member.points} 积分</span>
          </div>
        ) : (
          <span className="add-member">+ 添加会员（可获得积分）</span>
        )}
      </div>

      {/* Product Grid */}
      <div className="product-grid">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className="product-item"
            onClick={() => addToCart(product)}
          >
            <div className="product-name">{product.name}</div>
            <div className="product-price">¥{product.price.toFixed(2)}</div>
            <div className="product-stock">库存 {product.stock}</div>
          </div>
        ))}
      </div>

      {/* Cart Panel */}
      {showCart && (
        <div className="cart-panel">
          <div className="cart-header">
            <span>购物车 ({cart.length})</span>
            <button onClick={() => setShowCart(false)}>✕</button>
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <Empty description="购物车是空的" />
            ) : (
              cart.map(item => (
                <div key={item.productId} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">¥{item.price.toFixed(2)}</div>
                  </div>
                  <div className="cart-item-controls">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discount */}
          {member && (
            <div className="discount-section">
              <span>会员折扣</span>
              <select value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value))}>
                <option value={1}>无折扣</option>
                <option value={0.95}>95折</option>
                <option value={0.9}>9折</option>
                <option value={0.85}>85折</option>
                <option value={0.8}>8折</option>
              </select>
            </div>
          )}

          {/* Summary */}
          <div className="cart-summary">
            <div className="summary-row">
              <span>商品总价</span>
              <span>¥{totalAmount.toFixed(2)}</span>
            </div>
            {member && discount < 1 && (
              <div className="summary-row discount">
                <span>折扣</span>
                <span>-¥{(totalAmount - finalAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>应付金额</span>
              <span className="amount">¥{finalAmount.toFixed(2)}</span>
            </div>
            {member && (
              <div className="summary-row points">
                <span>获得积分</span>
                <span>+{pointsEarned}</span>
              </div>
            )}
          </div>

          <button
            className="btn-checkout"
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
          >
            {loading ? '处理中...' : `确认收款 ¥${finalAmount.toFixed(2)}`}
          </button>
        </div>
      )}

      {/* Member Search Modal */}
      {showMemberSearch && (
        <div className="modal-overlay" onClick={() => setShowMemberSearch(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>查找会员</span>
              <button onClick={() => setShowMemberSearch(false)}>✕</button>
            </div>
            <div className="modal-body">
              <input
                type="tel"
                placeholder="输入手机号"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
                maxLength={11}
              />
              <button className="btn-search" onClick={searchMember}>查找</button>
            </div>
            <div className="modal-footer">
              <button onClick={() => { setMember(null); setShowMemberSearch(false); }}>不使用会员</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && !showCart && (
        <div className="floating-cart" onClick={() => setShowCart(true)}>
          <div className="floating-cart-info">
            <span className="floating-cart-count">{cart.length} 件</span>
            <span className="floating-cart-amount">¥{finalAmount.toFixed(2)}</span>
          </div>
          <span className="floating-cart-text">去结算</span>
        </div>
      )}
    </div>
  );
}
