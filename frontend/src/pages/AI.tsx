import { useState, useEffect, useRef } from 'react';
import { Card, Empty, DotLoading, Toast } from 'antd-mobile';
import { aiApi } from '../api';
import './AI.css';

export default function AI() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: string; content: string; time?: string }[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'chat'>('suggestions');
  const [useLLM, setUseLLM] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSuggestions();
    // 初始化欢迎消息
    setMessages([{
      role: 'assistant',
      content: '👋 你好！我是智能补货助手「小补」\n\n我可以帮你：\n📦 分析库存状态\n💰 查看销售数据\n🤖 提供智能建议\n\n有什么想问的？',
      time: formatTime(new Date())
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data: any = await aiApi.getSuggestions();
      setSuggestions(data || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!input.trim() || chatLoading) return;

    const userMsg = { role: 'user', content: input.trim(), time: formatTime(new Date()) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setChatLoading(true);

    try {
      const res: any = await aiApi.chat(input, useLLM);
      const assistantMsg = {
        role: 'assistant',
        content: res.reply,
        time: formatTime(new Date())
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      Toast.show('发送失败，请稍后重试');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，服务出错了。请稍后再试。',
        time: formatTime(new Date())
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const getUrgencyConfig = (urgency: string) => {
    const map: any = {
      high: { color: '#ff4d4f', bg: '#fff2f0', text: '紧急', icon: '🔴' },
      medium: { color: '#fa8c16', bg: '#fff7e6', text: '备货', icon: '🟡' },
      low: { color: '#52c41a', bg: '#f6ffed', text: '充足', icon: '🟢' }
    };
    return map[urgency] || map.low;
  };

  const quickQuestions = [
    '库存还够吗？',
    '今天卖了多少？',
    '哪些需要补货？',
    '今日收入多少？',
  ];

  return (
    <div className="ai-page">
      {/* Tab Bar */}
      <div className="ai-tabs">
        <div
          className={`ai-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          📊 补货建议
        </div>
        <div
          className={`ai-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 AI 助手
        </div>
      </div>

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="suggestions-container">
          {loading ? (
            <div className="loading-state">
              <DotLoading />
              <span>加载中...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <Empty description="库存状态良好，无需补货 ✅" />
          ) : (
            <div className="suggestions-list">
              <div className="suggestions-header">
                <span>共 {suggestions.length} 个商品需要关注</span>
              </div>
              {suggestions.map((item, index) => {
                const config = getUrgencyConfig(item.urgency);
                return (
                  <Card key={index} className="suggestion-card">
                    <div className="suggestion-header">
                      <div className="suggestion-title">
                        <span className="urgency-icon">{config.icon}</span>
                        <span className="product-name">{item.productName}</span>
                      </div>
                      <div
                        className="urgency-badge"
                        style={{ background: config.bg, color: config.color }}
                      >
                        {config.text}
                      </div>
                    </div>

                    <div className="suggestion-stats">
                      <div className="stat-item">
                        <span className="stat-label">当前库存</span>
                        <span className="stat-value danger">{item.currentStock}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">最低库存</span>
                        <span className="stat-value">{item.minStock}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">可维持</span>
                        <span className="stat-value">{item.daysRemaining}天</span>
                      </div>
                    </div>

                    <div className="suggestion-action">
                      <div className="action-qty">
                        建议补货 <strong>{item.suggestedQty}</strong> 件
                      </div>
                      <div className="action-reason">{item.reason}</div>
                    </div>

                    <div className="suggestion-footer">
                      <span className="confidence">AI 信心度：{(item.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="chat-container">
          {/* LLM Toggle */}
          <div className="llm-toggle">
            <span className={`toggle-label ${useLLM ? 'active' : ''}`}>AI 增强模式</span>
            <div
              className={`toggle-switch ${useLLM ? 'on' : ''}`}
              onClick={() => setUseLLM(!useLLM)}
            >
              <div className="toggle-knob" />
            </div>
          </div>

          {/* Messages */}
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    {msg.content}
                  </div>
                  {msg.time && (
                    <div className="message-time">{msg.time}</div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="message-bubble typing">
                    <DotLoading />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="quick-questions">
            {quickQuestions.map((q, i) => (
              <div
                key={i}
                className="quick-question"
                onClick={() => setInput(q)}
              >
                {q}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入问题..."
              rows={1}
            />
            <button
              className="send-btn"
              onClick={handleChat}
              disabled={!input.trim() || chatLoading}
            >
              {chatLoading ? <DotLoading /> : '➤'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
