import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Image, Tag, message } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig.js';

const ClothingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clothing, setClothing] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClothingDetail = async () => {
      setLoading(true);
      try {
        console.log('获取衣物详情:', id);
        // 从API获取数据
        const response = await axiosInstance.get(`/clothing/${id}`);
        setClothing(response);
      } catch (error) {
        message.error('获取衣物详情失败');
        console.error('获取衣物详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClothingDetail();
  }, [id]);

  const handleBack = () => {
    navigate('/closet');
  };

  const handleEdit = () => {
    console.log('编辑衣物');
  };

  const handleDelete = () => {
    console.log('删除衣物');
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!clothing) {
    return <div>衣物不存在</div>;
  }

  return (
    <div className="page-transition">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginBottom: 16 }}>
        返回衣橱
      </Button>

      <Row gutter={[24, 24]}>
        <Col span={12}>
          <Card title="衣物图片" className="card-hover">
            <Image.PreviewGroup>
              {clothing.images.map(image => (
                <div key={image.id} className="image-container image-card image-hover image-shadow image-border mb-4">
                  <Image
                    src={image.url}
                    style={{ width: '100%', cursor: 'pointer' }}
                    alt={clothing.name}
                    className="image-loaded"
                    fallback="https://via.placeholder.com/400?text=图片加载失败"
                  />
                </div>
              ))}
            </Image.PreviewGroup>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="衣物信息" className="card-hover">
            <div style={{ marginBottom: 16 }}>
              <h2>{clothing.name}</h2>
              <p>分类: {clothing.category?.name || clothing.category}</p>
              <p>描述: {clothing.description || '暂无描述'}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3>标签</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(clothing.tags && clothing.tags.length > 0) ? clothing.tags.map((tag, index) => (
                  <Tag key={index} color="blue">{tag}</Tag>
                )) : (
                  <p style={{ color: 'var(--color-text-muted)' }}>暂无标签</p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p>创建时间: {new Date(clothing.createdAt).toLocaleString()}</p>
              <p>更新时间: {new Date(clothing.updatedAt).toLocaleString()}</p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                编辑
              </Button>
              <Button type="danger" icon={<DeleteOutlined />} onClick={handleDelete}>
                删除
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="搭配建议" className="card-hover" style={{ marginTop: 24 }}>
        <p>基于您的这件{clothing.name}，我们推荐以下搭配：</p>
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <h4>搭配1：牛仔裤</h4>
            <p>经典的{clothing.name}+牛仔裤组合，适合日常休闲场合。</p>
          </div>
          <div style={{ flex: 1 }}>
            <h4>搭配2：黑色短裙</h4>
            <p>{clothing.name}+黑色短裙，简约时尚，适合约会或聚会。</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ClothingDetail;