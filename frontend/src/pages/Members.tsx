import { useState, useEffect } from 'react';
import { Card, Empty, Button, Toast } from 'antd-mobile';
import { memberApi } from '../api';
import './Members.css';

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    level: 'normal',
    birthday: '',
    remark: '',
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data: any = await memberApi.list();
      setMembers(data || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMember(null);
    setFormData({ phone: '', name: '', level: 'normal', birthday: '', remark: '' });
    setShowAddModal(true);
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      phone: member.phone,
      name: member.name || '',
      level: member.level,
      birthday: member.birthday ? member.birthday.split('T')[0] : '',
      remark: member.remark || '',
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.phone) {
      Toast.show('手机号不能为空');
      return;
    }

    try {
      if (editingMember) {
        await memberApi.update(editingMember.id, formData);
        Toast.show('更新成功');
      } else {
        await memberApi.create(formData);
        Toast.show('添加成功');
      }
      setShowAddModal(false);
      loadMembers();
    } catch (error: any) {
      Toast.show(error.response?.data?.error || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该会员吗？')) return;
    try {
      await memberApi.delete(id);
      Toast.show('删除成功');
      loadMembers();
    } catch (error) {
      Toast.show('删除失败');
    }
  };

  const handlePointsAdjust = async (member: any, type: 'add' | 'deduct') => {
    const points = prompt(`${type === 'add' ? '添加' : '扣除'}积分数量：`);
    if (!points) return;

    const pointsNum = parseInt(points);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      Toast.show('请输入有效的积分数量');
      return;
    }

    try {
      await memberApi.adjustPoints(member.id, { type, points: pointsNum, remark: '' });
      Toast.show('积分调整成功');
      loadMembers();
    } catch (error: any) {
      Toast.show(error.response?.data?.error || '调整失败');
    }
  };

  const getLevelConfig = (level: string) => {
    const map: any = {
      normal: { name: '普通', color: '#999', bg: '#f5f5f5' },
      silver: { name: '银卡', color: '#C0C0C0', bg: '#f5f5f5' },
      gold: { name: '金卡', color: '#FFD700', bg: '#fffbe6' },
      diamond: { name: '钻石', color: '#B9F2FF', bg: '#e6f7ff' },
    };
    return map[level] || map.normal;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN');
  };

  return (
    <div className="members-page">
      <div className="page-header">
        <h2>会员管理</h2>
        <Button color="primary" size="small" onClick={handleAdd}>
          + 添加会员
        </Button>
      </div>

      <div className="members-list">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : members.length === 0 ? (
          <Empty description="暂无会员数据" />
        ) : (
          members.map(member => {
            const levelConfig = getLevelConfig(member.level);
            return (
              <Card key={member.id} className="member-card">
                <div className="member-header">
                  <div className="member-main">
                    <div className="member-name">
                      {member.name || '未命名'}
                      <span
                        className="level-badge"
                        style={{ color: levelConfig.color, background: levelConfig.bg }}
                      >
                        {levelConfig.name}
                      </span>
                    </div>
                    <div className="member-phone">{member.phone}</div>
                  </div>
                  <div className="member-points-box">
                    <div className="points-value">{member.points}</div>
                    <div className="points-label">积分</div>
                  </div>
                </div>

                <div className="member-stats">
                  <div className="stat-item">
                    <span className="stat-label">累计消费</span>
                    <span className="stat-value">¥{member.totalSpent.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">生日</span>
                    <span className="stat-value">{formatDate(member.birthday)}</span>
                  </div>
                </div>

                <div className="member-actions">
                  <Button
                    size="small"
                    onClick={() => handlePointsAdjust(member, 'add')}
                  >
                    + 积分
                  </Button>
                  <Button
                    size="small"
                    color="warning"
                    onClick={() => handlePointsAdjust(member, 'deduct')}
                  >
                    - 积分
                  </Button>
                  <Button size="small" onClick={() => handleEdit(member)}>
                    编辑
                  </Button>
                  <Button size="small" color="danger" onClick={() => handleDelete(member.id)}>
                    删除
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>{editingMember ? '编辑会员' : '添加会员'}</span>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-item">
                <label>手机号 *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入手机号"
                  maxLength={11}
                  disabled={!!editingMember}
                />
              </div>
              <div className="form-item">
                <label>姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="form-item">
                <label>会员等级</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="normal">普通会员</option>
                  <option value="silver">银卡会员</option>
                  <option value="gold">金卡会员</option>
                  <option value="diamond">钻石会员</option>
                </select>
              </div>
              <div className="form-item">
                <label>生日</label>
                <input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                />
              </div>
              <div className="form-item">
                <label>备注</label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="备注信息"
                  rows={3}
                />
              </div>
              <Button block color="primary" onClick={handleSave}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
