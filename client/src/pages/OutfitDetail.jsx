import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Image, List, Tag, message } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const OutfitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [outfit, setOutfit] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOutfitDetail = async () => {
      setLoading(true);
      try {
        console.log('获取穿搭详情:', id);
        // 模拟数据
        setOutfit({
          id,
          name: '休闲日常',
          description: '适合日常休闲穿着',
          occasion: '日常',
          season: '春季',
          imageUrl: 'https://via.placeholder.com/600',
          clothingItems: [
            { id: '1', name: '白色T恤', category: '上衣', imageUrl: 'https://via.placeholder.com/200' },
            { id: '2', name: '牛仔裤', category: '裤子', imageUrl: 'https://via.placeholder.com/200' },
            { id: '3', name: '运动鞋', category: '鞋子', imageUrl: 'https://via.placeholder.com/200' }
          ],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        });
      } catch (error) {
        message.error('获取穿搭详情失败');
        console.error('获取穿搭详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOutfitDetail();
  }, [id]);

  const handleBack = () => {
    navigate('/outfits');
  };

  const handleEdit = () => {
    console.log('编辑穿搭');
  };

  const handleDelete = () => {
    console.log('删除穿搭');
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!outfit) {
    return <div>穿搭方案不存在</div>;
  }

  return (
    <div className="page-transition">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginBottom: 16 }}>
        返回穿搭列表
      </Button>

      <Row gutter={[24, 24]}>
        <Col span={12}>
          <Card title="穿搭效果图" className="card-hover">
            <div className="image-container image-card image-hover image-shadow image-border">
              <Image
                src={outfit.imageUrl}
                style={{ width: '100%' }}
                alt={outfit.name}
                className="image-loaded"
              />
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="穿搭信息" className="card-hover">
            <div style={{ marginBottom: 16 }}>
              <h2>{outfit.name}</h2>
              <p>描述: {outfit.description}</p>
              <div style={{ display: 'flex', gap: 16, margin: '8px 0' }}>
                <Tag color="blue">场合: {outfit.occasion}</Tag>
                <Tag color="green">季节: {outfit.season}</Tag>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3>组成衣物</h3>
              <List
                dataSource={outfit.clothingItems}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Image src={item.imageUrl} style={{ width: 50, height: 50, objectFit: 'cover' }} />}
                      title={item.name}
                      description={item.category}
                    />
                  </List.Item>
                )}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <p>创建时间: {outfit.createdAt}</p>
              <p>更新时间: {outfit.updatedAt}</p>
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
    </div>
  );
};

export default OutfitDetail;