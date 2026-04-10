import { useState, useEffect } from 'react';
import { Card, Button, Empty } from 'antd-mobile';
import { aiApi } from '../api';

export default function AI() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: '您好！我是智能补货助手。我可以帮您：\n• 分析库存状态\n• 提供补货建议\n• 回答销售问题\n• 查看供应商信息\n\n有什么可以帮您的？' }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'chat'>('suggestions');

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data: any = await aiApi.getSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setChatLoading(true);

    try {
      const res: any = await aiApi.chat(input);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '抱歉，服务出错，请稍后再试。' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    const map: any = { high: '#ff4d4f', medium: '#faad14', low: '#52c41a' };
    return map[urgency] || '#999';
  };

  const getUrgencyText = (urgency: string) => {
    const map: any = { high: '紧急', medium: '中等', low: '可以' };
    return map[urgency] || urgency;
  };

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
        <div
          onClick={() => setActiveTab('suggestions')}
          style={{ flex: 1, textAlign: 'center', padding: '12px', borderBottom: activeTab === 'suggestions' ? '2px solid #1677ff' : 'none', color: activeTab === 'suggestions' ? '#1677ff' : '#999' }}
        >
          补货建议
        </div>
        <div
          onClick={() => setActiveTab('chat')}
          style={{ flex: 1, textAlign: 'center', padding: '12px', borderBottom: activeTab === 'chat' ? '2px solid #1677ff' : 'none', color: activeTab === 'chat' ? '#1677ff' : '#999' }}
        >
          AI 助手
        </div>
      </div>

      {activeTab === 'suggestions' ? (
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
          ) : suggestions.length === 0 ? (
            <Empty description="暂无补货建议，库存状态良好 ✅" />
          ) : (
            suggestions.map((item, index) => (
              <Card key={index} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.productName}</div>
                  <div style={{ backgroundColor: getUrgencyColor(item.urgency), color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                    {getUrgencyText(item.urgency)}
                  </div>
                </div>

                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                  <div>当前库存: <span style={{ color: '#ff4d4f' }}>{item.currentStock}</span> (最低: {item.minStock})</div>
                  <div>日均销量: {item.avgDailySales}</div>
                  <div>可维持: {item.daysRemaining} 天</div>
                </div>

                <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>建议</div>
                  <div style={{ fontSize: '14px' }}>建议补货 <span style={{ color: '#1677ff', fontWeight: 'bold' }}>{item.suggestedQty}</span> 件</div>
                </div>

                <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>{item.reason}</div>

                <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                  预测信心: {(item.confidence * 100).toFixed(0)}%
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '12px'
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? '#1677ff' : '#f5f5f5',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ textAlign: 'center', padding: '12px', color: '#999' }}>
                AI 思考中...
              </div>
            )}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid #eee', background: '#fff' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                placeholder="输入您的问题..."
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
              />
              <Button color="primary" onClick={handleChat} disabled={chatLoading}>
                发送
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
