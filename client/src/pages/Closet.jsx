import { useState, useEffect } from 'react';
import { Button, Input, Select, message, Spin } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig.js';

const { Search } = Input;
const { Option } = Select;

const Closet = () => {
  const [clothingList, setClothingList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

  // 获取衣物分类
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('获取衣物分类');
        // 尝试从API获取数据
        const response = await axiosInstance.get('/clothing/categories');
        setCategories(response);
      } catch (error) {
        console.error('获取分类失败:', error);
        message.error('获取分类失败，使用模拟数据');
        // 模拟数据作为后备
        setCategories([
          { id: '1', name: '上衣' },
          { id: '2', name: '裤子' },
          { id: '3', name: '裙子' },
          { id: '4', name: '鞋子' },
          { id: '5', name: '配饰' }
        ]);
      }
    };

    fetchCategories();
  }, []);

  // 获取衣物列表
  useEffect(() => {
    const fetchClothing = async () => {
      setLoading(true);
      try {
        console.log('获取衣物列表');
        // 尝试从API获取数据
        const response = await axiosInstance.get('/clothing');
        // 处理后端返回的分页数据结构
        if (response.clothing) {
          // 从分页数据中提取衣物列表
          setClothingList(response.clothing);
        } else if (Array.isArray(response)) {
          // 直接使用数组（备用情况）
          setClothingList(response);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('获取衣物列表失败:', error);
        message.error('获取衣物列表失败，使用模拟数据');
        // 模拟数据作为后备
        setClothingList([
          { id: '1', name: '白色纯棉T恤', categoryId: '1', categoryName: '上衣', imageUrl: '' },
          { id: '2', name: '修身牛仔裤', categoryId: '2', categoryName: '裤子', imageUrl: '' },
          { id: '3', name: '黑色连衣裙', categoryId: '3', categoryName: '裙子', imageUrl: '' },
          { id: '4', name: '白色运动鞋', categoryId: '4', categoryName: '鞋子', imageUrl: '' },
          { id: '5', name: '复古太阳镜', categoryId: '5', categoryName: '配饰', imageUrl: '' },
          { id: '6', name: '蓝色衬衫', categoryId: '1', categoryName: '上衣', imageUrl: '' },
          { id: '7', name: '黑色西装裤', categoryId: '2', categoryName: '裤子', imageUrl: '' },
          { id: '8', name: '红色高跟鞋', categoryId: '4', categoryName: '鞋子', imageUrl: '' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchClothing();
  }, []);

  const handleAddClothing = () => {
    // 跳转到添加衣物页面
    navigate('/closet/add');
  };

  const handleClothingClick = (id) => {
    navigate(`/clothing/${id}`);
  };

  // 筛选衣物列表
  const filteredClothing = clothingList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-transition">
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
          <h1 className="page-title" style={{ marginBottom: 0 }}>我的衣橱</h1>
          <p style={{ 
            color: 'var(--color-text-secondary)', 
            fontSize: 'var(--font-size-lg)',
            margin: 'var(--spacing-1) 0 0 0'
          }}>
            管理您的时尚单品，打造完美穿搭
          </p>
        </div>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddClothing}
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
          添加衣物
        </Button>
      </div>

      {/* 搜索和筛选区域 */}
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
        <div style={{ flex: 1, minWidth: '250px' }}>
          <Search
            placeholder="搜索衣物名称..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: '100%',
              borderRadius: 'var(--radius-base)',
            }}
            className="search-input"
          />
        </div>
        
        <div style={{ minWidth: '200px' }}>
          <Select
            placeholder="选择分类"
            style={{ width: '100%', borderRadius: 'var(--radius-base)' }}
            allowClear
            onChange={setSelectedCategory}
            size="large"
          >
            {categories.map(category => (
              <Option key={category.id} value={category.id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {/* 衣物列表 */}
      {loading ? (
        <div className="loading-container">
          <Spin size="large" style={{ color: 'var(--color-accent)' }} />
        </div>
      ) : filteredClothing.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--spacing-6)',
        }}>
          {filteredClothing.map((clothing, index) => (
            <div
              key={clothing.id}
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
              onClick={() => handleClothingClick(clothing.id)}
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
              {/* 衣物图片 */}
              <div className="image-container image-card image-hover image-shadow image-border">
                <img
                  alt={clothing.name}
                  src={(clothing.images && clothing.images.length > 0 ? clothing.images[0].imageUrl : clothing.imageUrl) || 'https://via.placeholder.com/300x300?text=时尚单品'}
                  style={{
                    width: '100%',
                    height: '300px',
                    objectFit: 'cover',
                  }}
                  className="image-loaded"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300?text=图片加载失败';
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
                  margin: '0 0 var(--spacing-2) 0',
                  lineHeight: 'var(--line-height-tight)',
                }}>
                  {clothing.name}
                </h3>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'var(--spacing-4)',
                  paddingTop: 'var(--spacing-4)',
                  borderTop: '1px solid var(--color-border)',
                }}>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                  }}>
                    ID: {clothing.id}
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-accent)',
                    fontWeight: 'var(--font-weight-semibold)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    查看详情
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
            🧥
          </div>
          <h3>衣橱空空如也</h3>
          <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-6)' }}>
            开始添加您的第一件时尚单品吧！
          </p>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddClothing}
            size="large"
            style={{
              padding: 'var(--spacing-3) var(--spacing-6)',
              fontSize: 'var(--font-size-lg)',
            }}
          >
            添加衣物
          </Button>
        </div>
      )}
    </div>
  );
};

export default Closet;