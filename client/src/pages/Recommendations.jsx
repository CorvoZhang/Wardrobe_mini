import { useState, useEffect, useCallback } from 'react';
import { Select, message, Tabs, Spin, Input, Button, Tag, Alert } from 'antd';
import { ShoppingOutlined, BorderOutlined, RobotOutlined, SearchOutlined, BulbOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';

const { Option } = Select;
const { TextArea } = Input;

const Recommendations = () => {
  const [recommendedClothing, setRecommendedClothing] = useState([]);
  const [recommendedOutfits, setRecommendedOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  
  // AI 自然语言推荐状态
  const [nlpQuery, setNlpQuery] = useState('');
  const [nlpLoading, setNlpLoading] = useState(false);
  const [nlpResults, setNlpResults] = useState(null);
  const [nlpParsedResult, setNlpParsedResult] = useState(null);
  const [nlpSuggestions, setNlpSuggestions] = useState([]);
  
  const navigate = useNavigate();

  // 获取推荐衣物
  const fetchRecommendedClothing = useCallback(async (categoryId = null) => {
    setLoading(true);
    try {
      const params = { limit: 10 };
      if (categoryId) {
        params.categoryId = categoryId;
      }
      
      const response = await axiosInstance.get('/recommendations/clothing', { params });
      
      // 处理API返回的数据，添加占位图片URL
      const clothingWithImages = (response.clothing || []).map(item => ({
        ...item,
        imageUrl: item.imageUrl || `https://via.placeholder.com/300x300?text=${encodeURIComponent(item.name)}`,
        categoryName: item.categoryName || getCategoryName(item.categoryId)
      }));
      
      setRecommendedClothing(clothingWithImages);
    } catch (error) {
      console.error('获取推荐衣物失败:', error);
      // 如果API调用失败，显示空列表
      setRecommendedClothing([]);
      if (error.response?.status !== 401) {
        message.error('获取推荐衣物失败');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取推荐穿搭
  const fetchRecommendedOutfits = useCallback(async (occasion = null, season = null) => {
    setLoading(true);
    try {
      const params = { limit: 5 };
      if (occasion) {
        params.occasion = occasion;
      }
      if (season) {
        params.season = season;
      }
      
      const response = await axiosInstance.get('/recommendations/outfits', { params });
      
      // 处理API返回的数据，添加占位图片URL和衣物数量
      const outfitsWithImages = (response.outfits || []).map(item => ({
        ...item,
        imageUrl: item.imageUrl || `https://via.placeholder.com/600x400?text=${encodeURIComponent(item.name)}`,
        clothingCount: item.Clothing?.length || 0
      }));
      
      setRecommendedOutfits(outfitsWithImages);
    } catch (error) {
      console.error('获取推荐穿搭失败:', error);
      // 如果API调用失败，显示空列表
      setRecommendedOutfits([]);
      if (error.response?.status !== 401) {
        message.error('获取推荐穿搭失败');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 根据分类ID获取分类名称
  const getCategoryName = (categoryId) => {
    const categoryMap = {
      '1': '上衣',
      '2': '裤子',
      '3': '裙子',
      '4': '鞋子',
      '5': '配饰'
    };
    return categoryMap[categoryId] || '其他';
  };

  useEffect(() => {
    fetchRecommendedClothing();
    fetchRecommendedOutfits();
  }, [fetchRecommendedClothing, fetchRecommendedOutfits]);

  const handleClothingClick = (id) => {
    navigate(`/clothing/${id}`);
  };

  const handleOutfitClick = (id) => {
    navigate(`/outfit/${id}`);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    fetchRecommendedClothing(value);
  };

  const handleOccasionChange = (value) => {
    setSelectedOccasion(value);
    fetchRecommendedOutfits(value, selectedSeason);
  };

  const handleSeasonChange = (value) => {
    setSelectedSeason(value);
    fetchRecommendedOutfits(selectedOccasion, value);
  };

  // AI 自然语言推荐
  const handleNlpSearch = async () => {
    if (!nlpQuery.trim()) {
      message.warning('请输入您的穿搭需求描述');
      return;
    }
    
    setNlpLoading(true);
    setNlpResults(null);
    setNlpParsedResult(null);
    setNlpSuggestions([]);
    
    try {
      const response = await axiosInstance.post('/recommendations/nlp', {
        description: nlpQuery,
        type: 'clothing',
        limit: 12
      });
      
      if (response.success) {
        setNlpResults(response.data.recommendations || []);
        setNlpParsedResult(response.data.parsedResult);
        setNlpSuggestions(response.data.suggestions || []);
        
        if (response.data.isMock) {
          message.info('AI 推荐完成（Mock 模式）');
        } else {
          message.success('AI 智能推荐完成！');
        }
      } else {
        message.error(response.message || 'AI 推荐失败');
      }
    } catch (error) {
      console.error('AI 推荐失败:', error);
      message.error('AI 推荐失败，请稍后重试');
    } finally {
      setNlpLoading(false);
    }
  };

  // 示例查询
  const exampleQueries = [
    '我想找一件适合约会穿的裙子',
    '推荐一些适合夏天职场穿的衣服',
    '有什么休闲风格的上衣推荐吗',
    '冬天保暖又好看的外套',
    '适合运动的舒适穿搭'
  ];

  return (
    <div className="page-transition">
      {/* 页面标题 */}
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 className="page-title">智能推荐</h1>
        <p style={{ 
          color: 'var(--color-text-secondary)', 
          fontSize: 'var(--font-size-lg)',
        }}>
          基于您的衣橱和偏好，为您推荐个性化的时尚选择
        </p>
      </div>
      
      {/* 标签页 */}
      <Tabs
        defaultActiveKey="1"
        size="large"
        style={{
          backgroundColor: 'var(--color-secondary)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-6)',
          boxShadow: 'var(--shadow-base)',
          border: '1px solid var(--color-border)',
        }}
        tabBarStyle={{
          marginBottom: 'var(--spacing-6)',
        }}
        items={[
          {
            key: '1',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <ShoppingOutlined style={{ color: 'var(--color-accent)' }} />
                衣物推荐
              </span>
            ),
            children: (
              <div>
                {/* 筛选区域 */}
                <div style={{
                  display: 'flex',
                  gap: 'var(--spacing-4)',
                  marginBottom: 'var(--spacing-6)',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ minWidth: '200px' }}>
                    <Select
                      placeholder="选择分类"
                      style={{ width: '100%', borderRadius: 'var(--radius-base)' }}
                      allowClear
                      onChange={handleCategoryChange}
                      size="large"
                    >
                      <Option value="1">上衣</Option>
                      <Option value="2">裤子</Option>
                      <Option value="3">裙子</Option>
                      <Option value="4">鞋子</Option>
                      <Option value="5">配饰</Option>
                    </Select>
                  </div>
                </div>
                
                {/* 衣物列表 */}
                {loading ? (
                  <div className="loading-container">
                    <Spin size="large" style={{ color: 'var(--color-accent)' }} />
                  </div>
                ) : recommendedClothing.length > 0 ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 'var(--spacing-6)',
                  }}>
                    {recommendedClothing.map((clothing, index) => (
                      <div
                        key={clothing.id}
                        className={`card-hover stagger-${index % 5 + 1}`}
                        style={{
                          backgroundColor: 'var(--color-secondary)',
                          borderRadius: 'var(--radius-xl)',
                          overflow: 'hidden',
                          boxShadow: 'var(--shadow-base)',
                          border: '1px solid var(--color-border)',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleClothingClick(clothing.id)}
                      >
                        {/* 衣物图片 */}
                        <div style={{
                          height: '300px',
                          overflow: 'hidden',
                          backgroundColor: 'var(--color-light)',
                          position: 'relative',
                        }}>
                          <img
                            alt={clothing.name}
                            src={clothing.imageUrl}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform var(--transition-slow)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          />
                          
                          {/* 分类标签 */}
                          <div style={{
                            position: 'absolute',
                            top: 'var(--spacing-3)',
                            left: 'var(--spacing-3)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            color: 'var(--color-primary)',
                            padding: 'var(--spacing-1) var(--spacing-3)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            boxShadow: 'var(--shadow-sm)',
                          }}>
                            {clothing.categoryName}
                          </div>
                        </div>
                        
                        {/* 衣物信息 */}
                        <div style={{
                          padding: 'var(--spacing-5)',
                        }}>
                          <h3 style={{
                            fontSize: 'var(--font-size-xl)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-text-primary)',
                            margin: 0,
                            lineHeight: 'var(--line-height-tight)',
                          }}>
                            {clothing.name}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{
                    padding: 'var(--spacing-12)',
                  }}>
                    <div style={{
                      fontSize: 'var(--font-size-5xl)',
                      marginBottom: 'var(--spacing-4)',
                      opacity: 0.5,
                    }}>
                      🧥
                    </div>
                    <h3>暂无推荐衣物</h3>
                    <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-6)' }}>
                      系统正在学习您的穿搭偏好，敬请期待更多推荐！
                    </p>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: '2',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <BorderOutlined style={{ color: 'var(--color-accent)' }} />
                穿搭推荐
              </span>
            ),
            children: (
              <div>
                {/* 筛选区域 */}
                <div style={{
                  display: 'flex',
                  gap: 'var(--spacing-4)',
                  marginBottom: 'var(--spacing-6)',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ minWidth: '200px' }}>
                    <Select
                      placeholder="选择场合"
                      style={{ width: '100%', borderRadius: 'var(--radius-base)' }}
                      allowClear
                      onChange={handleOccasionChange}
                      size="large"
                    >
                      <Option value="日常">日常</Option>
                      <Option value="职场">职场</Option>
                      <Option value="约会">约会</Option>
                      <Option value="聚会">聚会</Option>
                      <Option value="运动">运动</Option>
                    </Select>
                  </div>
                  <div style={{ minWidth: '200px' }}>
                    <Select
                      placeholder="选择季节"
                      style={{ width: '100%', borderRadius: 'var(--radius-base)' }}
                      allowClear
                      onChange={handleSeasonChange}
                      size="large"
                    >
                      <Option value="春季">春季</Option>
                      <Option value="夏季">夏季</Option>
                      <Option value="秋季">秋季</Option>
                      <Option value="冬季">冬季</Option>
                    </Select>
                  </div>
                </div>
                
                {/* 穿搭列表 */}
                {loading ? (
                  <div className="loading-container">
                    <Spin size="large" style={{ color: 'var(--color-accent)' }} />
                  </div>
                ) : recommendedOutfits.length > 0 ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: 'var(--spacing-6)',
                  }}>
                    {recommendedOutfits.map((outfit, index) => (
                      <div
                        key={outfit.id}
                        className={`card-hover stagger-${index % 5 + 1}`}
                        style={{
                          backgroundColor: 'var(--color-secondary)',
                          borderRadius: 'var(--radius-xl)',
                          overflow: 'hidden',
                          boxShadow: 'var(--shadow-base)',
                          border: '1px solid var(--color-border)',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleOutfitClick(outfit.id)}
                      >
                        {/* 穿搭图片 */}
                        <div style={{
                          height: '280px',
                          overflow: 'hidden',
                          backgroundColor: 'var(--color-light)',
                          position: 'relative',
                        }}>
                          <img
                            alt={outfit.name}
                            src={outfit.imageUrl}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform var(--transition-slow)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{
                    padding: 'var(--spacing-12)',
                  }}>
                    <div style={{
                      fontSize: 'var(--font-size-5xl)',
                      marginBottom: 'var(--spacing-4)',
                      opacity: 0.5,
                    }}>
                      🎀
                    </div>
                    <h3>暂无推荐穿搭</h3>
                    <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-6)' }}>
                      系统正在学习您的穿搭偏好，敬请期待更多推荐！
                    </p>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: '3',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <RobotOutlined style={{ color: 'var(--color-accent)' }} />
                AI 智能推荐
              </span>
            ),
            children: (
              <div>
                {/* 自然语言输入区域 */}
                <div style={{
                  marginBottom: 'var(--spacing-6)',
                  padding: 'var(--spacing-6)',
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)',
                    marginBottom: 'var(--spacing-3)',
                  }}>
                    <BulbOutlined style={{ color: 'var(--color-accent)', fontSize: '20px' }} />
                    <span style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-primary)',
                    }}>
                      用自然语言描述您的穿搭需求
                    </span>
                  </div>
                  
                  <TextArea
                    value={nlpQuery}
                    onChange={(e) => setNlpQuery(e.target.value)}
                    placeholder="例如：我想找一件适合约会穿的连衣裙，颜色偏浅色系..."
                    rows={3}
                    style={{
                      borderRadius: 'var(--radius-base)',
                      marginBottom: 'var(--spacing-4)',
                      fontSize: 'var(--font-size-base)',
                    }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleNlpSearch();
                      }
                    }}
                  />
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-3)',
                  }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={nlpLoading ? <LoadingOutlined spin /> : <SearchOutlined />}
                      onClick={handleNlpSearch}
                      loading={nlpLoading}
                      style={{
                        borderRadius: 'var(--radius-base)',
                        height: '48px',
                        paddingLeft: 'var(--spacing-6)',
                        paddingRight: 'var(--spacing-6)',
                      }}
                    >
                      {nlpLoading ? 'AI 分析中...' : 'AI 智能搜索'}
                    </Button>
                    
                    {/* 示例查询 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)',
                      }}>
                        试试：
                      </span>
                      {exampleQueries.slice(0, 3).map((query, index) => (
                        <Tag
                          key={index}
                          style={{
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-full)',
                            padding: 'var(--spacing-1) var(--spacing-3)',
                          }}
                          onClick={() => setNlpQuery(query)}
                        >
                          {query.length > 15 ? query.substring(0, 15) + '...' : query}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* AI 解析结果 */}
                {nlpParsedResult && (
                  <div style={{
                    marginBottom: 'var(--spacing-6)',
                    padding: 'var(--spacing-4)',
                    backgroundColor: 'rgba(192, 160, 98, 0.1)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-accent)',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)',
                      marginBottom: 'var(--spacing-3)',
                    }}>
                      <RobotOutlined style={{ color: 'var(--color-accent)' }} />
                      <span style={{
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text-primary)',
                      }}>
                        AI 理解了您的需求
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--spacing-2)',
                      marginBottom: 'var(--spacing-3)',
                    }}>
                      {nlpParsedResult.season && (
                        <Tag color="blue">季节: {nlpParsedResult.season}</Tag>
                      )}
                      {nlpParsedResult.occasion && (
                        <Tag color="green">场合: {nlpParsedResult.occasion}</Tag>
                      )}
                      {nlpParsedResult.style && (
                        <Tag color="orange">风格: {nlpParsedResult.style}</Tag>
                      )}
                      {nlpParsedResult.color && (
                        <Tag color="purple">颜色: {nlpParsedResult.color}</Tag>
                      )}
                      {nlpParsedResult.category && (
                        <Tag color="cyan">类别: {nlpParsedResult.category}</Tag>
                      )}
                    </div>
                    
                    {/* AI 建议 */}
                    {nlpSuggestions.length > 0 && (
                      <div>
                        <p style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text-primary)',
                          marginBottom: 'var(--spacing-2)',
                        }}>
                          AI 穿搭建议：
                        </p>
                        <ul style={{
                          margin: 0,
                          paddingLeft: 'var(--spacing-5)',
                          color: 'var(--color-text-secondary)',
                          fontSize: 'var(--font-size-sm)',
                        }}>
                          {nlpSuggestions.map((suggestion, index) => (
                            <li key={index} style={{ marginBottom: 'var(--spacing-1)' }}>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 推荐结果 */}
                {nlpLoading ? (
                  <div className="loading-container">
                    <Spin size="large" style={{ color: 'var(--color-accent)' }} />
                    <p style={{ marginTop: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
                      AI 正在为您分析穿搭需求...
                    </p>
                  </div>
                ) : nlpResults && nlpResults.length > 0 ? (
                  <div>
                    <h3 style={{
                      fontSize: 'var(--font-size-xl)',
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--spacing-4)',
                      color: 'var(--color-text-primary)',
                    }}>
                      为您推荐 {nlpResults.length} 件衣物
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 'var(--spacing-6)',
                    }}>
                      {nlpResults.map((clothing, index) => {
                        const imageUrl = clothing.images?.[0]?.imageUrl || 
                          `https://via.placeholder.com/300x300?text=${encodeURIComponent(clothing.name)}`;
                        
                        return (
                          <div
                            key={clothing.id}
                            className={`card-hover stagger-${index % 5 + 1}`}
                            style={{
                              backgroundColor: 'var(--color-secondary)',
                              borderRadius: 'var(--radius-xl)',
                              overflow: 'hidden',
                              boxShadow: 'var(--shadow-base)',
                              border: '1px solid var(--color-border)',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleClothingClick(clothing.id)}
                          >
                            <div style={{
                              height: '280px',
                              overflow: 'hidden',
                              backgroundColor: 'var(--color-light)',
                              position: 'relative',
                            }}>
                              <img
                                alt={clothing.name}
                                src={imageUrl}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform var(--transition-slow)',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              />
                              
                              {/* 属性标签 */}
                              <div style={{
                                position: 'absolute',
                                bottom: 'var(--spacing-3)',
                                left: 'var(--spacing-3)',
                                right: 'var(--spacing-3)',
                                display: 'flex',
                                gap: 'var(--spacing-2)',
                                flexWrap: 'wrap',
                              }}>
                                {clothing.style && (
                                  <span style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    color: 'var(--color-primary)',
                                    padding: 'var(--spacing-1) var(--spacing-2)',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: 'var(--font-size-xs)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                  }}>
                                    {clothing.style}
                                  </span>
                                )}
                                {clothing.color && (
                                  <span style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    color: 'var(--color-primary)',
                                    padding: 'var(--spacing-1) var(--spacing-2)',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: 'var(--font-size-xs)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                  }}>
                                    {clothing.color}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div style={{
                              padding: 'var(--spacing-5)',
                            }}>
                              <h3 style={{
                                fontSize: 'var(--font-size-lg)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--color-text-primary)',
                                margin: 0,
                                lineHeight: 'var(--line-height-tight)',
                              }}>
                                {clothing.name}
                              </h3>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : nlpResults !== null ? (
                  <Alert
                    type="info"
                    showIcon
                    message="未找到匹配的衣物"
                    description="尝试调整您的描述，或者添加更多衣物到衣橱中。"
                    style={{ borderRadius: 'var(--radius-lg)' }}
                  />
                ) : (
                  <div className="empty-state" style={{
                    padding: 'var(--spacing-12)',
                  }}>
                    <div style={{
                      fontSize: 'var(--font-size-5xl)',
                      marginBottom: 'var(--spacing-4)',
                      opacity: 0.5,
                    }}>
                      🤖
                    </div>
                    <h3>AI 智能推荐</h3>
                    <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-6)' }}>
                      用自然语言描述您的穿搭需求，AI 将为您智能匹配衣橱中的衣物
                    </p>
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Recommendations;