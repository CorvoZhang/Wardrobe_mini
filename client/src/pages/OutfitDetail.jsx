import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Image, List, Tag, message, Modal, Input, Tooltip, Spin, Popconfirm, Form, Select, Checkbox } from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ShareAltOutlined, 
  CopyOutlined, 
  CheckOutlined,
  LinkOutlined,
  LoadingOutlined,
  EyeOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig.js';

const { Option } = Select;
const { TextArea } = Input;

const OutfitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [outfit, setOutfit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareExpires, setShareExpires] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // 编辑相关状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [userClothing, setUserClothing] = useState([]);
  const [selectedClothingIds, setSelectedClothingIds] = useState([]);
  const [clothingLoading, setClothingLoading] = useState(false);

  // 获取穿搭详情
  const fetchOutfitDetail = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/outfits/${id}`);
      const outfitData = response;
      
      // 处理衣物数据
      const clothingItems = (outfitData.clothing || []).map(item => ({
        id: item.id,
        name: item.name,
        category: item.categoryId,
        imageUrl: item.images?.[0]?.imageUrl || 'https://via.placeholder.com/200?text=No+Image',
        color: item.color,
        style: item.style
      }));
      
      setOutfit({
        ...outfitData,
        clothingItems,
        imageUrl: outfitData.imageUrl || 'https://via.placeholder.com/600?text=No+Image'
      });
    } catch (error) {
      message.error('获取穿搭详情失败');
      console.error('获取穿搭详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutfitDetail();
  }, [id]);

  // 获取用户所有衣物（用于编辑时选择）
  const fetchUserClothing = async () => {
    setClothingLoading(true);
    try {
      const response = await axiosInstance.get('/clothing', { params: { limit: 100 } });
      const clothes = response.clothing || response || [];
      setUserClothing(clothes.filter(item => item.images && item.images.length > 0));
    } catch (error) {
      console.error('获取衣物列表失败:', error);
    } finally {
      setClothingLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/outfits');
  };

  // 打开编辑弹窗
  const handleEdit = () => {
    editForm.setFieldsValue({
      name: outfit.name,
      description: outfit.description || '',
      occasion: outfit.occasion || '',
      season: outfit.season || ''
    });
    // 设置已选择的衣物
    setSelectedClothingIds(outfit.clothingItems?.map(item => item.id) || []);
    fetchUserClothing();
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);

      // 1. 更新穿搭基本信息
      await axiosInstance.put(`/outfits/${id}`, {
        name: values.name,
        description: values.description,
        occasion: values.occasion,
        season: values.season
      });

      // 2. 获取当前穿搭中的衣物ID
      const currentClothingIds = outfit.clothingItems?.map(item => item.id) || [];
      
      // 3. 计算需要添加和删除的衣物
      const toAdd = selectedClothingIds.filter(cid => !currentClothingIds.includes(cid));
      const toRemove = currentClothingIds.filter(cid => !selectedClothingIds.includes(cid));

      // 4. 添加新衣物
      for (const clothingId of toAdd) {
        await axiosInstance.post(`/outfits/${id}/clothing`, {
          clothingId,
          position: 'main'
        });
      }

      // 5. 移除衣物
      for (const clothingId of toRemove) {
        await axiosInstance.delete(`/outfits/${id}/clothing/${clothingId}`);
      }

      message.success('穿搭方案更新成功');
      setEditModalVisible(false);
      
      // 刷新穿搭详情
      fetchOutfitDetail();
      
    } catch (error) {
      console.error('更新穿搭失败:', error);
      message.error('更新穿搭失败，请稍后重试');
    } finally {
      setEditLoading(false);
    }
  };

  // 切换衣物选择
  const toggleClothingSelection = (clothingId) => {
    setSelectedClothingIds(prev => {
      if (prev.includes(clothingId)) {
        return prev.filter(id => id !== clothingId);
      } else {
        return [...prev, clothingId];
      }
    });
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/outfits/${id}`);
      message.success('穿搭方案删除成功');
      navigate('/outfits');
    } catch (error) {
      console.error('删除穿搭失败:', error);
      message.error('删除穿搭失败');
    }
  };

  // 生成分享链接
  const handleShare = async () => {
    setShareModalVisible(true);
    setShareLoading(true);
    setShareUrl('');
    setCopied(false);
    
    try {
      const response = await axiosInstance.post(`/outfits/${id}/share`, {
        expiresInDays: 7
      });
      
      if (response.success) {
        setShareUrl(response.data.shareUrl);
        setShareExpires(response.data.expiresAt);
        message.success('分享链接生成成功！');
      } else {
        message.error(response.message || '生成分享链接失败');
      }
    } catch (error) {
      console.error('生成分享链接失败:', error);
      message.error('生成分享链接失败，请稍后重试');
    } finally {
      setShareLoading(false);
    }
  };

  // 复制分享链接
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      message.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      message.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '300px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!outfit) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)' }}>
          穿搭方案不存在
        </p>
        <Button type="primary" onClick={() => navigate('/outfits')}>
          返回穿搭列表
        </Button>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginBottom: 16 }}>
        返回穿搭列表
      </Button>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="穿搭效果图" className="card-hover">
            <div className="image-container image-card image-hover image-shadow image-border">
              <Image
                src={outfit.imageUrl}
                style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
                alt={outfit.name}
                className="image-loaded"
                fallback="https://via.placeholder.com/600?text=No+Image"
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="穿搭信息" className="card-hover">
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 12px 0' }}>{outfit.name}</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {outfit.description || '暂无描述'}
              </p>
              <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
                {outfit.occasion && <Tag color="blue">场合: {outfit.occasion}</Tag>}
                {outfit.season && <Tag color="green">季节: {outfit.season}</Tag>}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: '12px' }}>组成衣物 ({outfit.clothingItems?.length || 0} 件)</h3>
              {outfit.clothingItems && outfit.clothingItems.length > 0 ? (
                <List
                  dataSource={outfit.clothingItems}
                  renderItem={item => (
                    <List.Item 
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/clothing/${item.id}`)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Image 
                            src={item.imageUrl} 
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '8px' }}
                            preview={false}
                            fallback="https://via.placeholder.com/60?text=No+Image"
                          />
                        }
                        title={
                          <span style={{ color: 'var(--color-text-primary)' }}>
                            {item.name}
                          </span>
                        }
                        description={
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {item.color && <Tag size="small">{item.color}</Tag>}
                            {item.style && <Tag size="small">{item.style}</Tag>}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <p style={{ color: 'var(--color-text-secondary)' }}>暂无衣物</p>
              )}
            </div>

            <div style={{ marginBottom: 16, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              <p style={{ margin: '4px 0' }}>
                创建时间: {outfit.createdAt ? new Date(outfit.createdAt).toLocaleString() : '-'}
              </p>
              <p style={{ margin: '4px 0' }}>
                更新时间: {outfit.updatedAt ? new Date(outfit.updatedAt).toLocaleString() : '-'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                编辑
              </Button>
              <Tooltip title="生成分享链接，分享给好友">
                <Button 
                  icon={<ShareAltOutlined />} 
                  onClick={handleShare}
                  style={{ 
                    borderColor: 'var(--color-accent)', 
                    color: 'var(--color-accent)' 
                  }}
                >
                  分享
                </Button>
              </Tooltip>
              <Popconfirm
                title="确定要删除这个穿搭方案吗？"
                description="删除后无法恢复"
                onConfirm={handleDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 分享弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShareAltOutlined style={{ color: 'var(--color-accent)' }} />
            <span>分享穿搭方案</span>
          </div>
        }
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
        width={500}
      >
        {shareLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <LoadingOutlined style={{ fontSize: '32px', color: 'var(--color-accent)' }} />
            <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>
              正在生成分享链接...
            </p>
          </div>
        ) : shareUrl ? (
          <div>
            <div style={{ 
              padding: '16px', 
              backgroundColor: 'var(--color-background)', 
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--color-text-secondary)',
                marginBottom: '8px'
              }}>
                <LinkOutlined style={{ marginRight: '8px' }} />
                分享链接（7天内有效）
              </p>
              <Input.Group compact style={{ display: 'flex' }}>
                <Input 
                  value={shareUrl} 
                  readOnly 
                  style={{ flex: 1 }}
                />
                <Tooltip title={copied ? '已复制' : '复制链接'}>
                  <Button 
                    type="primary"
                    icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={handleCopyLink}
                    style={{ 
                      backgroundColor: copied ? '#52c41a' : undefined 
                    }}
                  >
                    {copied ? '已复制' : '复制'}
                  </Button>
                </Tooltip>
              </Input.Group>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '12px',
              backgroundColor: 'rgba(192, 160, 98, 0.1)',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <EyeOutlined style={{ color: 'var(--color-accent)' }} />
              <span>分享的穿搭方案将展示衣物详情，好友无需登录即可查看</span>
            </div>
            
            {shareExpires && (
              <p style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: 'var(--color-text-secondary)',
                textAlign: 'center'
              }}>
                链接有效期至: {new Date(shareExpires).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)' }}>
            生成分享链接失败，请重试
          </div>
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: 'var(--color-accent)' }} />
            <span>编辑穿搭方案</span>
          </div>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSaveEdit}
        confirmLoading={editLoading}
        okText="保存"
        cancelText="取消"
        width={700}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="穿搭名称"
                rules={[
                  { required: true, message: '请输入穿搭名称' },
                  { min: 2, max: 50, message: '名称长度应在2-50个字符之间' }
                ]}
              >
                <Input placeholder="请输入穿搭名称" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="occasion" label="适用场合">
                <Select placeholder="请选择场合" size="large" allowClear>
                  <Option value="日常">日常</Option>
                  <Option value="职场">职场</Option>
                  <Option value="约会">约会</Option>
                  <Option value="聚会">聚会</Option>
                  <Option value="运动">运动</Option>
                  <Option value="正式">正式</Option>
                  <Option value="休闲">休闲</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="season" label="适用季节">
                <Select placeholder="请选择季节" size="large" allowClear>
                  <Option value="春季">春季</Option>
                  <Option value="夏季">夏季</Option>
                  <Option value="秋季">秋季</Option>
                  <Option value="冬季">冬季</Option>
                  <Option value="四季">四季通用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="description" label="描述">
                <TextArea 
                  placeholder="请输入穿搭描述（可选）" 
                  rows={1}
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 衣物选择 */}
          <Form.Item 
            label={
              <span>
                选择衣物 
                <span style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontWeight: 'normal',
                  marginLeft: 8
                }}>
                  （已选 {selectedClothingIds.length} 件）
                </span>
              </span>
            }
          >
            {clothingLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin />
                <p style={{ marginTop: 8, color: 'var(--color-text-secondary)' }}>
                  加载衣物列表...
                </p>
              </div>
            ) : userClothing.length > 0 ? (
              <div style={{ 
                maxHeight: 300, 
                overflowY: 'auto',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: 12
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                  gap: 12 
                }}>
                  {userClothing.map(item => {
                    const isSelected = selectedClothingIds.includes(item.id);
                    const imageUrl = item.images?.[0]?.imageUrl || 'https://via.placeholder.com/100?text=No+Image';
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleClothingSelection(item.id)}
                        style={{
                          position: 'relative',
                          cursor: 'pointer',
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: isSelected ? '3px solid var(--color-accent)' : '2px solid var(--color-border)',
                          transition: 'all 0.2s',
                          opacity: isSelected ? 1 : 0.8
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: 80,
                            objectFit: 'cover'
                          }}
                        />
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'var(--color-accent)',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <CheckOutlined style={{ color: '#fff', fontSize: 12 }} />
                          </div>
                        )}
                        <div style={{
                          padding: '4px 6px',
                          backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-background)',
                          color: isSelected ? '#fff' : 'var(--color-text-primary)',
                          fontSize: 11,
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: 24, 
                color: 'var(--color-text-secondary)',
                border: '1px dashed var(--color-border)',
                borderRadius: 8
              }}>
                <p>衣橱中暂无衣物</p>
                <Button 
                  type="link" 
                  onClick={() => {
                    setEditModalVisible(false);
                    navigate('/closet/add');
                  }}
                >
                  去添加衣物
                </Button>
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OutfitDetail;