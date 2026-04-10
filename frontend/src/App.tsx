import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';

import Login from './pages/Login';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import AddProduct from './pages/AddProduct';
import Suppliers from './pages/Suppliers';
import Orders from './pages/Orders';
import Sales from './pages/Sales';
import Checkout from './pages/Checkout';
import Members from './pages/Members';
import Promotions from './pages/Promotions';
import AI from './pages/AI';
import Layout from './components/Layout';
import { useAppStore } from './stores';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAppStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="products/add" element={<AddProduct />} />
            <Route path="products/edit/:id" element={<AddProduct />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="sales" element={<Sales />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="members" element={<Members />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="ai" element={<AI />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
