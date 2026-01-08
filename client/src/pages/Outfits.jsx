import { useState, useEffect } from 'react';
import { Button, Select, message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig.js';

const { Option } = Select;

const Outfits = () => {
  const [outfitList, setOutfitList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const navigate = useNavigate();

  // 获取穿搭列表
  useEffect(() => {
    const fetchOutfits = async () => {
      setLoading(true);
      try {
        console.log('获取穿搭列表');
        // 尝试从API获取数据
        const response = await axiosInstance.get('/outfits');
        // 处理后端返回的分页数据结构
        if (response.outfits) {
          // 从分页数据中提取穿搭列表
          setOutfitList(response.outfits);
        } else if (Array.isArray(response)) {
          // 直接使用数组（备用情况）
          setOutfitList(response);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('获取穿搭列表失败:', error);
        message.error('获取穿搭列表失败，使用模拟数据');
        // 模拟数据作为后备
        setOutfitList([
          {
            id: '1',
            name: '休闲日常',
            description: '适合日常休闲穿着',
            occasion: '日常',
            season: '春季',
            clothingCount: 3,
            imageUrl: 'https://via.placeholder.com/600x400?text=休闲日常'
          },
          {
            id: '2',
            name: '职场通勤',
            description: '适合办公室穿着',
            occasion: '职场',
            season: '秋季',
            clothingCount: 4,
            imageUrl: 'https://via.placeholder.com/600x400?text=职场通勤'
          },
          {
            id: '3',
            name: '约会装扮',
            description: '适合约会场合',
            occasion: '约会',
            season: '夏季',
            clothingCount: 3,
            imageUrl: 'https://via.placeholder.com/600x400?text=约会装扮'
          },
          {
            id: '4',
            name: '周末聚会',
            description: '适合周末聚会穿着',
            occasion: '聚会',
            season: '夏季',
            clothingCount: 4,
            imageUrl: 'https://via.placeholder.com/600x400?text=周末聚会'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchOutfits();
  }, []);

  const handleAddOutfit = () => {
    navigate('/outfits/create');
    alert('创建穿搭功能开发中');
  };

  const handleOutfitClick = (id) => {
    navigate(`/outfit/${id}`);
  };

  // 筛选穿搭列表
  const filteredOutfits = outfitList.filter(item => {
    const matchesOccasion = !selectedOccasion || item.occasion === selectedOccasion;
    const matchesSeason = !selectedSeason || item.season === selectedSeason;
    return matchesOccasion && matchesSeason;
  });

  // 场合选项
  const occasionOptions = ['日常', '职场', '约会', '聚会', '运动'];
  // 季节选项
  const seasonOptions = ['春季', '夏季', '秋季', '冬季'];

  return (
    <div style={{ animation: 'fadeIn 0.6s ease' }}>
      {/* 页面标题和操作区域 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-8)',
        flexWrap: 'wrap',
        gap: 'var(--spacing-4)',
      }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>我的穿搭</h1>
          <p style={{ 
            color: 'var(--color-text-secondary)', 
            fontSize: 'var(--font-size-lg)',
            margin: 'var(--spacing-1) 0 0 0'
          }}>
            探索您的专属穿搭方案，展现独特时尚品味
          </p>
        </div>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddOutfit}
          size="large"
          style={{
            padding: 'var(--spacing-3) var(--spacing-6)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            borderRadius: 'var(--radius-base)',
            boxShadow: 'var(--shadow-md)',
            transition: 'all var(--transition-base)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          创建穿搭
        </Button>
      </div>

      {/* 筛选区域 */}
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-8)',
        flexWrap: 'wrap',
        backgroundColor: 'var(--color-secondary)',
        padding: 'var(--spacing-4)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-base)',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ minWidth: '200px' }}>
          <Select
            placeholder="选择场合"
            style={{ width: '100%', borderRadius: 'var(--radius-base)' }}
            allowClear
            onChange={setSelectedOccasion}
            size="large"
          >
            {occasionOptions.map(occasion => (
              <Option key={occasion} value={occasion}>
                {occasion}
              </Option>
            ))}
          </Select>
        </div>
        
        <div style={{ minWidth: '200px' }}>
          <Select
            placeholder="选择季节"
            style={{ width: '100%', borderRadius: 'var(--radius-base)' }}
            allowClear
            onChange={setSelectedSeason}
            size="large"
          >
            {seasonOptions.map(season => (
              <Option key={season} value={season}>
                {season}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {/* 穿搭列表 */}
      {loading ? (
        <div className="loading-container">
          <Spin size="large" style={{ color: 'var(--color-accent)' }} />
        </div>
      ) : filteredOutfits.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 'var(--spacing-6)',
        }}>
          {filteredOutfits.map((outfit, index) => (
            <div
              key={outfit.id}
              style={{
                backgroundColor: 'var(--color-secondary)',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-base)',
                border: '1px solid var(--color-border)',
                transition: 'all var(--transition-base)',
                animation: `fadeIn 0.6s ease ${0.1 * index}s both`,
                cursor: 'pointer',
              }}
              onClick={() => handleOutfitClick(outfit.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                e.currentTarget.style.borderColor = 'var(--color-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-base)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              {/* 穿搭图片 */}
              <div className="image-container image-hover image-shadow image-border" style={{ height: '280px' }}>
                <img
                  alt={outfit.name}
                  src={outfit.imageUrl}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                  }}
                  className="image-loaded"
                />
                
                {/* 标签区域 */}
                <div style={{
                  position: 'absolute',
                  bottom: 'var(--spacing-3)',
                  left: 'var(--spacing-3)',
                  right: 'var(--spacing-3)',
                  display: 'flex',
                  gap: 'var(--spacing-2)',
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: 'var(--color-primary)',
                    padding: 'var(--spacing-1) var(--spacing-3)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    {outfit.occasion}
                  </span>
                  <span style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: 'var(--color-primary)',
                    padding: 'var(--spacing-1) var(--spacing-3)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    {outfit.season}
                  </span>
                </div>
              </div>
              
              {/* 穿搭信息 */}
              <div style={{
                padding: 'var(--spacing-5)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 'var(--spacing-3)',
                }}>
                  <h3 style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    lineHeight: 'var(--line-height-tight)',
                  }}>
                    {outfit.name}
                  </h3>
                  <span style={{
                    backgroundColor: 'var(--color-light)',
                    color: 'var(--color-primary)',
                    padding: 'var(--spacing-1) var(--spacing-3)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}>
                    {outfit.clothingCount} 件
                  </span>
                </div>
                
                <p style={{
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: 'var(--line-height-relaxed)',
                }}>
                  {outfit.description}
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginTop: 'var(--spacing-4)',
                  paddingTop: 'var(--spacing-4)',
                  borderTop: '1px solid var(--color-border)',
                }}>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-accent)',
                    fontWeight: 'var(--font-weight-semibold)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    查看详情 →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{
          backgroundColor: 'var(--color-secondary)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-16)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-base)',
        }}>
          <div style={{
            fontSize: 'var(--font-size-5xl)',
            marginBottom: 'var(--spacing-4)',
            opacity: 0.5,
          }}>
            🎀
          </div>
          <h3>暂无穿搭方案</h3>
          <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-6)' }}>
            开始创建您的第一个穿搭方案，展现您的时尚品味吧！
          </p>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddOutfit}
            size="large"
            style={{ 
              padding: 'var(--spacing-3) var(--spacing-6)',
              fontSize: 'var(--font-size-lg)',
            }}
          >
            创建穿搭
          </Button>
        </div>
      )}
    </div>
  );
};

export default Outfits;