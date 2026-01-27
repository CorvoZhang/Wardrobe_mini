import { useState, useEffect } from 'react';
import { Card, Row, Col, Image, List, Tag, Spin, Button, Alert } from 'antd';
import { 
  EyeOutlined, 
  CalendarOutlined, 
  UserOutlined,
  ClockCircleOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// 获取 API 基础地址，从环境变量读取
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// 创建一个不带认证的 axios 实例
const publicAxios = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

const SharedOutfit = () => {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const [outfit, setOutfit] = useState(null);
  const [shareInfo, setShareInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedOutfit = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await publicAxios.get(`/outfits/shared/${shareCode}`);
        
        if (response.data.success) {
          setOutfit(response.data.data.outfit);
          setShareInfo({
            sharedBy: response.data.data.sharedBy,
            viewCount: response.data.data.viewCount,
            expiresAt: response.data.data.expiresAt
          });
        } else {
          setError(response.data.message || '获取分享内容失败');
        }
      } catch (error) {
        console.error('获取分享穿搭失败:', error);
        if (error.response?.status === 404) {
          setError('分享链接不存在或已失效');
        } else if (error.response?.status === 410) {
          setError('分享链接已过期');
        } else {
          setError('获取分享内容失败，请稍后重试');
        }
      } finally {
        setLoading(false);
      }
    };

    if (shareCode) {
      fetchSharedOutfit();
    }
  }, [shareCode]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px', color: '#666' }}>正在加载分享内容...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: '24px'
      }}>
        <Alert
          type="error"
          showIcon
          message="无法加载分享内容"
          description={error}
          style={{ maxWidth: '400px', marginBottom: '24px' }}
        />
        <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/login')}>
          前往登录
        </Button>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '24px'
    }}>
      {/* 顶部品牌栏 */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto 24px',
        padding: '16px 24px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ color: '#000' }}>CHANEL</span>
          <span style={{ color: '#666', fontWeight: 'normal', fontSize: '16px' }}>CLOSET</span>
        </div>
        <Button type="primary" onClick={() => navigate('/login')}>
          登录 / 注册
        </Button>
      </header>

      {/* 分享信息提示 */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 24px',
        padding: '16px 24px',
        backgroundColor: 'rgba(192, 160, 98, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(192, 160, 98, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666' }}>
            <UserOutlined />
            分享者: {shareInfo?.sharedBy || '匿名用户'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666' }}>
            <EyeOutlined />
            浏览: {shareInfo?.viewCount || 0} 次
          </span>
          {shareInfo?.expiresAt && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#999', fontSize: '12px' }}>
              <ClockCircleOutlined />
              有效期至: {new Date(shareInfo.expiresAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* 穿搭详情 */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card 
              title={
                <span style={{ fontSize: '18px', fontWeight: '600' }}>
                  穿搭效果图
                </span>
              }
              style={{ borderRadius: '12px' }}
            >
              <div style={{
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <Image
                  src={outfit?.imageUrl || 'https://via.placeholder.com/600?text=No+Image'}
                  style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
                  alt={outfit?.name}
                  fallback="https://via.placeholder.com/600?text=No+Image"
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card 
              title={
                <span style={{ fontSize: '18px', fontWeight: '600' }}>
                  穿搭信息
                </span>
              }
              style={{ borderRadius: '12px' }}
            >
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 12px 0', fontSize: '24px' }}>
                  {outfit?.name || '未命名穿搭'}
                </h2>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  {outfit?.description || '暂无描述'}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {outfit?.occasion && (
                    <Tag color="blue" style={{ padding: '4px 12px', fontSize: '14px' }}>
                      场合: {outfit.occasion}
                    </Tag>
                  )}
                  {outfit?.season && (
                    <Tag color="green" style={{ padding: '4px 12px', fontSize: '14px' }}>
                      季节: {outfit.season}
                    </Tag>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                  组成衣物 ({outfit?.clothing?.length || 0} 件)
                </h3>
                {outfit?.clothing && outfit.clothing.length > 0 ? (
                  <List
                    dataSource={outfit.clothing}
                    renderItem={item => {
                      const imageUrl = item.images?.[0]?.imageUrl || 'https://via.placeholder.com/60?text=No+Image';
                      
                      return (
                        <List.Item style={{ padding: '12px 0' }}>
                          <List.Item.Meta
                            avatar={
                              <Image 
                                src={imageUrl} 
                                style={{ 
                                  width: 70, 
                                  height: 70, 
                                  objectFit: 'cover', 
                                  borderRadius: '8px' 
                                }}
                                preview={true}
                                fallback="https://via.placeholder.com/70?text=No+Image"
                              />
                            }
                            title={
                              <span style={{ fontSize: '15px', fontWeight: '500' }}>
                                {item.name}
                              </span>
                            }
                            description={
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                {item.color && <Tag size="small">{item.color}</Tag>}
                                {item.style && <Tag size="small">{item.style}</Tag>}
                                {item.season && <Tag size="small">{item.season}</Tag>}
                              </div>
                            }
                          />
                        </List.Item>
                      );
                    }}
                  />
                ) : (
                  <p style={{ color: '#999' }}>暂无衣物信息</p>
                )}
              </div>

              {outfit?.createdAt && (
                <div style={{ 
                  fontSize: '13px', 
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CalendarOutlined />
                  创建于: {new Date(outfit.createdAt).toLocaleDateString()}
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* 底部行动召唤 */}
        <div style={{
          marginTop: '32px',
          padding: '32px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>
            喜欢这个穿搭？
          </h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            注册 CHANEL CLOSET，创建您自己的时尚衣橱，获取 AI 智能穿搭推荐
          </p>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate('/register')}
            style={{ marginRight: '12px' }}
          >
            立即注册
          </Button>
          <Button 
            size="large"
            onClick={() => navigate('/login')}
          >
            已有账号？登录
          </Button>
        </div>
      </div>

      {/* 页脚 */}
      <footer style={{
        maxWidth: '1200px',
        margin: '48px auto 0',
        padding: '24px',
        textAlign: 'center',
        color: '#999',
        fontSize: '13px'
      }}>
        <p>© {new Date().getFullYear()} CHANEL CLOSET. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default SharedOutfit;
