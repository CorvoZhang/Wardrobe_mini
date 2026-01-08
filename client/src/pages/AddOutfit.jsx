import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message, Spin, Card, Checkbox, Empty } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig.js';

const { Option } = Select;
const { TextArea } = Input;

const AddOutfit = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [clothingLoading, setClothingLoading] = useState(false);
  const [clothingList, setClothingList] = useState([]);
  const [selectedClothing, setSelectedClothing] = useState([]);
  const navigate = useNavigate();

  // 场合选项
  const occasionOptions = ['日常', '职场', '约会', '聚会', '运动', '正式', '休闲', '旅行'];
  
  // 季节选项
  const seasonOptions = ['春季', '夏季', '秋季', '冬季', '四季通用'];

  // 获取用户衣物列表
  useEffect(() => {
    const fetchClothing = async () => {
      setClothingLoading(true);
      try {
        const response = await axiosInstance.get('/clothing', { params: { limit: 100 } });
        if (response.clothing) {
          setClothingList(response.clothing);
        } else if (Array.isArray(response)) {
          setClothingList(response);
        }
      } catch (error) {
        console.error('获取衣物列表失败:', error);
        message.error('获取衣物列表失败');
      } finally {
        setClothingLoading(false);
      }
    };

    fetchClothing();
  }, []);

  // 处理衣物选择
  const handleClothingSelect = (clothingId) => {
    setSelectedClothing(prev => {
      if (prev.includes(clothingId)) {
        return prev.filter(id => id !== clothingId);
      } else {
        return [...prev, clothingId];
      }
    });
  };

  // 提交表单
  const handleSubmit = async (values) => {
    if (selectedClothing.length === 0) {
      message.warning('请至少选择一件衣物');
      return;
    }

    setLoading(true);
    try {
      const outfitData = {
        ...values,
        clothingIds: selectedClothing
      };

      await axiosInstance.post('/outfits', outfitData);
      message.success('穿搭创建成功！');
      navigate('/outfits');
    } catch (error) {
      console.error('创建穿搭失败:', error);
      message.error(error.response?.data?.message || '创建穿搭失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取衣物图片
  const getClothingImage = (clothing) => {
    if (clothing.images && clothing.images.length > 0) {
      return clothing.images[0].imageUrl;
    }
    return 'https://via.placeholder.com/150?text=No+Image';
  };

  return (
    <div className="page-transition">
      {/* 页面标题 */}
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/outfits')}
          style={{
            marginBottom: 'var(--spacing-4)',
            color: 'var(--color-text-secondary)',
          }}
        >
          返回穿搭列表
        </Button>
        <h1 className="page-title">创建穿搭</h1>
        <p style={{ 
          color: 'var(--color-text-secondary)', 
          fontSize: 'var(--font-size-lg)',
          margin: 'var(--spacing-1) 0 0 0'
        }}>
          选择衣物组合，创建您的专属穿搭方案
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-8)', flexWrap: 'wrap' }}>
        {/* 左侧：穿搭信息表单 */}
        <div style={{
          flex: '1 1 400px',
          backgroundColor: 'var(--color-secondary)',
          padding: 'var(--spacing-8)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-base)',
          border: '1px solid var(--color-border)',
        }}>
          <h2 style={{ 
            fontSize: 'var(--font-size-xl)', 
            marginBottom: 'var(--spacing-6)',
            color: 'var(--color-primary)'
          }}>
            穿搭信息
          </h2>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            {/* 穿搭名称 */}
            <Form.Item
              name="name"
              label="穿搭名称"
              rules={[
                { required: true, message: '请输入穿搭名称' },
                { min: 2, max: 50, message: '名称长度应在2-50个字符之间' }
              ]}
            >
              <Input
                placeholder="例如：春日休闲装"
                size="large"
                style={{ borderRadius: 'var(--radius-base)' }}
              />
            </Form.Item>

            {/* 穿搭描述 */}
            <Form.Item
              name="description"
              label="穿搭描述"
            >
              <TextArea
                placeholder="描述一下这套穿搭的风格和适用场景..."
                rows={3}
                style={{ borderRadius: 'var(--radius-base)' }}
              />
            </Form.Item>

            {/* 场合选择 */}
            <Form.Item
              name="occasion"
              label="适用场合"
              rules={[{ required: true, message: '请选择适用场合' }]}
            >
              <Select
                placeholder="选择适用场合"
                size="large"
                style={{ borderRadius: 'var(--radius-base)' }}
              >
                {occasionOptions.map(occasion => (
                  <Option key={occasion} value={occasion}>
                    {occasion}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 季节选择 */}
            <Form.Item
              name="season"
              label="适用季节"
              rules={[{ required: true, message: '请选择适用季节' }]}
            >
              <Select
                placeholder="选择适用季节"
                size="large"
                style={{ borderRadius: 'var(--radius-base)' }}
              >
                {seasonOptions.map(season => (
                  <Option key={season} value={season}>
                    {season}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 已选衣物数量 */}
            <div style={{
              padding: 'var(--spacing-4)',
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-base)',
              marginBottom: 'var(--spacing-6)',
              border: '1px solid var(--color-border)',
            }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                已选择衣物：
              </span>
              <span style={{ 
                color: 'var(--color-accent)', 
                fontWeight: 'var(--font-weight-bold)',
                marginLeft: 'var(--spacing-2)'
              }}>
                {selectedClothing.length} 件
              </span>
            </div>

            {/* 提交按钮 */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                icon={<PlusOutlined />}
                disabled={selectedClothing.length === 0}
                style={{
                  borderRadius: 'var(--radius-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                创建穿搭
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* 右侧：衣物选择区域 */}
        <div style={{
          flex: '2 1 500px',
          backgroundColor: 'var(--color-secondary)',
          padding: 'var(--spacing-8)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-base)',
          border: '1px solid var(--color-border)',
        }}>
          <h2 style={{ 
            fontSize: 'var(--font-size-xl)', 
            marginBottom: 'var(--spacing-6)',
            color: 'var(--color-primary)'
          }}>
            选择衣物
          </h2>

          {clothingLoading ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
              <Spin size="large" />
            </div>
          ) : clothingList.length === 0 ? (
            <Empty
              description={
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  您的衣橱还没有衣物，请先添加衣物
                </span>
              }
            >
              <Button 
                type="primary" 
                onClick={() => navigate('/closet/add')}
              >
                添加衣物
              </Button>
            </Empty>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 'var(--spacing-4)',
              maxHeight: '500px',
              overflowY: 'auto',
              padding: 'var(--spacing-2)',
            }}>
              {clothingList.map(clothing => (
                <Card
                  key={clothing.id}
                  hoverable
                  onClick={() => handleClothingSelect(clothing.id)}
                  style={{
                    borderRadius: 'var(--radius-base)',
                    overflow: 'hidden',
                    border: selectedClothing.includes(clothing.id) 
                      ? '2px solid var(--color-accent)' 
                      : '1px solid var(--color-border)',
                    transition: 'all var(--transition-base)',
                  }}
                  bodyStyle={{ padding: 'var(--spacing-3)' }}
                  cover={
                    <div style={{ 
                      position: 'relative',
                      height: '120px',
                      overflow: 'hidden',
                    }}>
                      <img
                        alt={clothing.name}
                        src={getClothingImage(clothing)}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <Checkbox
                        checked={selectedClothing.includes(clothing.id)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => handleClothingSelect(clothing.id)}
                      />
                    </div>
                  }
                >
                  <Card.Meta
                    title={
                      <span style={{ 
                        fontSize: 'var(--font-size-sm)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                      }}>
                        {clothing.name}
                      </span>
                    }
                    description={
                      <span style={{ 
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                      }}>
                        {clothing.category?.name || '未分类'}
                      </span>
                    }
                  />
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddOutfit;
