import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Toast, Card } from 'antd-mobile';
import { authApi } from '../api';
import { useAppStore } from '../stores';

export default function Login() {
  const [phone, setPhone] = useState('13800138000');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setToken } = useAppStore();

  const handleLogin = async () => {
    if (!phone) {
      Toast.show('请输入手机号');
      return;
    }
    setLoading(true);
    try {
      let res: any;
      if (code === '123456') {
        res = await authApi.login(phone, undefined, code);
      } else {
        res = await authApi.login(phone, password);
      }

      setToken(res.token);
      setUser(res.user);
      Toast.show('登录成功');
      navigate('/');
    } catch (error: any) {
      Toast.show(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px', paddingTop: '60px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#1677ff' }}>智能补货助手</h1>
        <p style={{ color: '#999', fontSize: '14px' }}>让补货更简单</p>
      </div>

      <Card style={{ borderRadius: '8px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Input
            placeholder="手机号"
            value={phone}
            onChange={(val) => setPhone(val)}
            type="phone"
            style={{ fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Input
            placeholder="密码（可选）"
            value={password}
            onChange={(val) => setPassword(val)}
            type="password"
            style={{ fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <Input
            placeholder="验证码（测试用: 123456）"
            value={code}
            onChange={(val) => setCode(val)}
            style={{ fontSize: '16px' }}
          />
        </div>

        <Button block color="primary" size="large" loading={loading} onClick={handleLogin}>
          登录
        </Button>

        <p style={{ marginTop: '16px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
          测试账号：13800138000 / 验证码：123456
        </p>
      </Card>
    </div>
  );
}
