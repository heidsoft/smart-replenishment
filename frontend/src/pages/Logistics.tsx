import { useState, useEffect } from 'react';
import { Card, Tabs, Empty, Button, Toast } from 'antd-mobile';
import { logisticsApi } from '../api';
import './Logistics.css';

export default function Logistics() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddShipment, setShowAddShipment] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: '', code: '', phone: '' });
  const [shipmentForm, setShipmentForm] = useState({
    orderNo: '', expressNo: '', companyId: 0,
    receiverName: '', receiverPhone: '', receiverAddr: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [companiesData, shipmentsData]: any = await Promise.all([
        logisticsApi.listCompanies(),
        logisticsApi.listShipments(),
      ]);
      setCompanies(companiesData || []);
      setShipments(shipmentsData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async () => {
    if (!companyForm.name || !companyForm.code) {
      Toast.show('请填写完整信息');
      return;
    }
    try {
      await logisticsApi.createCompany(companyForm);
      Toast.show('添加成功');
      setShowAddCompany(false);
      setCompanyForm({ name: '', code: '', phone: '' });
      loadData();
    } catch (error: any) {
      Toast.show(error.response?.data?.error || '添加失败');
    }
  };

  const handleAddShipment = async () => {
    if (!shipmentForm.orderNo || !shipmentForm.expressNo) {
      Toast.show('请填写完整信息');
      return;
    }
    try {
      await logisticsApi.createShipment(shipmentForm);
      Toast.show('添加成功');
      setShowAddShipment(false);
      setShipmentForm({ orderNo: '', expressNo: '', companyId: 0, receiverName: '', receiverPhone: '', receiverAddr: '' });
      loadData();
    } catch (error: any) {
      Toast.show(error.response?.data?.error || '添加失败');
    }
  };

  const getStatusConfig = (status: string) => {
    const map: any = {
      pending: { color: '#fa8c16', text: '待发货' },
      shipped: { color: '#1677ff', text: '已发货' },
      in_transit: { color: '#1677ff', text: '运输中' },
      delivered: { color: '#52c41a', text: '已送达' },
      returned: { color: '#ff4d4f', text: '已退回' },
    };
    return map[status] || { color: '#999', text: status };
  };

  return (
    <div className="logistics-page">
      <Tabs defaultActiveKey="companies">
        <Tabs.Tab title='快递公司' key='companies'>
          <div className="section">
            <div className="section-header">
              <h3>合作快递</h3>
              <Button size='small' color='primary' onClick={() => setShowAddCompany(true)}>
                + 添加
              </Button>
            </div>

            {loading ? (
              <div className="loading">加载中...</div>
            ) : companies.length === 0 ? (
              <Empty description="暂无快递公司" />
            ) : (
              <div className="company-list">
                {companies.map(company => (
                  <Card key={company.id} className="company-card">
                    <div className="company-info">
                      <div className="company-name">{company.name}</div>
                      <div className="company-code">代码: {company.code}</div>
                      {company.phone && (
                        <div className="company-phone">电话: {company.phone}</div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tabs.Tab>

        <Tabs.Tab title='发货记录' key='shipments'>
          <div className="section">
            <div className="section-header">
              <h3>发货列表</h3>
              <Button size='small' color='primary' onClick={() => setShowAddShipment(true)}>
                + 新发货
              </Button>
            </div>

            {shipments.length === 0 ? (
              <Empty description="暂无发货记录" />
            ) : (
              <div className="shipment-list">
                {shipments.map(shipment => {
                  const statusConfig = getStatusConfig(shipment.status);
                  return (
                    <Card key={shipment.id} className="shipment-card">
                      <div className="shipment-header">
                        <div className="shipment-order">订单: {shipment.orderNo}</div>
                        <div
                          className="shipment-status"
                          style={{ background: statusConfig.color }}
                        >
                          {statusConfig.text}
                        </div>
                      </div>
                      <div className="shipment-info">
                        <div className="info-row">
                          <span className="label">快递单号:</span>
                          <span className="value">{shipment.expressNo}</span>
                        </div>
                        {shipment.company && (
                          <div className="info-row">
                            <span className="label">快递公司:</span>
                            <span className="value">{shipment.company.name}</span>
                          </div>
                        )}
                        {shipment.receiverName && (
                          <div className="info-row">
                            <span className="label">收件人:</span>
                            <span className="value">{shipment.receiverName} {shipment.receiverPhone}</span>
                          </div>
                        )}
                        <div className="info-row">
                          <span className="label">创建时间:</span>
                          <span className="value">{new Date(shipment.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Tabs.Tab>
      </Tabs>

      {/* Add Company Modal */}
      {showAddCompany && (
        <div className="modal-overlay" onClick={() => setShowAddCompany(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>添加快递公司</span>
              <button onClick={() => setShowAddCompany(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-item">
                <label>公司名称 *</label>
                <input
                  placeholder="如：顺丰速运"
                  value={companyForm.name}
                  onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                />
              </div>
              <div className="form-item">
                <label>快递代码 *</label>
                <input
                  placeholder="如：SF"
                  value={companyForm.code}
                  onChange={e => setCompanyForm({ ...companyForm, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="form-item">
                <label>客服电话</label>
                <input
                  placeholder="可选"
                  value={companyForm.phone}
                  onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })}
                />
              </div>
              <Button block color='primary' onClick={handleAddCompany}>
                添加
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shipment Modal */}
      {showAddShipment && (
        <div className="modal-overlay" onClick={() => setShowAddShipment(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>创建发货</span>
              <button onClick={() => setShowAddShipment(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-item">
                <label>订单号 *</label>
                <input
                  placeholder="订单编号"
                  value={shipmentForm.orderNo}
                  onChange={e => setShipmentForm({ ...shipmentForm, orderNo: e.target.value })}
                />
              </div>
              <div className="form-item">
                <label>快递单号 *</label>
                <input
                  placeholder="快递运单号"
                  value={shipmentForm.expressNo}
                  onChange={e => setShipmentForm({ ...shipmentForm, expressNo: e.target.value })}
                />
              </div>
              <div className="form-item">
                <label>快递公司</label>
                <select
                  value={shipmentForm.companyId}
                  onChange={e => setShipmentForm({ ...shipmentForm, companyId: parseInt(e.target.value) })}
                >
                  <option value={0}>选择快递公司</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-item">
                <label>收件人</label>
                <input
                  placeholder="收件人姓名"
                  value={shipmentForm.receiverName}
                  onChange={e => setShipmentForm({ ...shipmentForm, receiverName: e.target.value })}
                />
              </div>
              <div className="form-item">
                <label>收件电话</label>
                <input
                  placeholder="收件人电话"
                  value={shipmentForm.receiverPhone}
                  onChange={e => setShipmentForm({ ...shipmentForm, receiverPhone: e.target.value })}
                />
              </div>
              <div className="form-item">
                <label>收件地址</label>
                <textarea
                  placeholder="详细地址"
                  rows={2}
                  value={shipmentForm.receiverAddr}
                  onChange={e => setShipmentForm({ ...shipmentForm, receiverAddr: e.target.value })}
                />
              </div>
              <Button block color='primary' onClick={handleAddShipment}>
                创建发货
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
