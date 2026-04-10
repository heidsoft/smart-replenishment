import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TabBar } from 'antd-mobile';

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { key: '/dashboard', title: '首页', icon: '🏠' },
    { key: '/products', title: '商品', icon: '📦' },
    { key: '/orders', title: '订单', icon: '📋' },
    { key: '/sales', title: '销售', icon: '💰' },
    { key: '/ai', title: 'AI助手', icon: '🤖' },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
      <TabBar
        activeKey={location.pathname}
        onChange={(key) => navigate(key)}
      >
        {tabs.map((tab) => (
          <TabBar.Item key={tab.key} title={tab.title} icon={<span>{tab.icon}</span>} />
        ))}
      </TabBar>
    </div>
  );
}
