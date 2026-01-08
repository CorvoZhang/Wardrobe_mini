import { useState, useEffect, useRef } from 'react';
import { Statistic, message } from 'antd';
import { UserOutlined, AppstoreOutlined, BorderOutlined, ShoppingOutlined } from '@ant-design/icons';
import axiosInstance from '../utils/axiosConfig';

const Dashboard = () => {
  const [stats, setStats] = useState({
    clothingCount: 0,
    outfitCount: 0,
    categoryCount: 0,
    recommendationCount: 0
  });

  // 滚动动画引用
  const animatedElementsRef = useRef([]);

  // 滚动动画逻辑
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    animatedElementsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      animatedElementsRef.current.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  useEffect(() => {
    // 调用API获取统计数据
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get('/users/stats');
        setStats({
          clothingCount: response.clothingCount || 0,
          outfitCount: response.outfitCount || 0,
          categoryCount: response.categoryCount || 0,
          recommendationCount: response.recommendationCount || 0
        });
      } catch (error) {
        console.error('获取统计数据失败:', error);
        // 如果API调用失败，使用默认值
        setStats({
          clothingCount: 0,
          outfitCount: 0,
          categoryCount: 0,
          recommendationCount: 0
        });
      }
    };

    fetchStats();
  }, []);

  // 统计卡片数据
  const statCards = [
    {
      title: '衣物数量',
      value: stats.clothingCount,
      icon: <AppstoreOutlined />,
      color: 'var(--color-success)',
      description: '您的衣橱总共有多少件衣物'
    },
    {
      title: '穿搭方案',
      value: stats.outfitCount,
      icon: <BorderOutlined />,
      color: 'var(--color-info)',
      description: '您已创建的穿搭方案数量'
    },
    {
      title: '分类数量',
      value: stats.categoryCount,
      icon: <UserOutlined />,
      color: 'var(--color-accent)',
      description: '您的衣物分类数量'
    },
    {
      title: '推荐数量',
      value: stats.recommendationCount,
      icon: <ShoppingOutlined />,
      color: 'var(--color-warning)',
      description: '系统为您推荐的穿搭方案'
    }
  ];

  return (
    <div className="page-transition">
      {/* 欢迎区域 - 香奈儿简约风格 */}
      <div 
        ref={(el) => (animatedElementsRef.current[0] = el)} 
        className="scroll-animate"
        style={{
          background: 'var(--color-primary)',
          borderRadius: 'var(--radius-base)',
          padding: 'var(--spacing-16)',
          color: 'var(--color-text-light)',
          marginBottom: 'var(--spacing-12)',
          boxShadow: 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <h1 style={{
          fontSize: 'var(--font-size-4xl)',
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--spacing-4)',
          lineHeight: 'var(--line-height-tight)',
          fontFamily: 'var(--font-family)',
          letterSpacing: 'var(--letter-spacing-tight)',
        }}>
          欢迎回来，时尚达人
        </h1>
        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: 'rgba(255, 255, 255, 0.9)',
          margin: 0,
          maxWidth: '600px',
          fontFamily: 'var(--font-family-sans)',
        }}>
          穿搭不仅是日常任务，更是一种积极进取的生活态度与生活方式。
          让我们一起打造您的专属时尚风格。
        </p>
      </div>

      {/* 统计卡片区域 - 香奈儿简约风格 */}
      <div ref={(el) => (animatedElementsRef.current[1] = el)} className="scroll-animate">
        <h2 style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-8)',
          fontFamily: 'var(--font-family)',
          letterSpacing: 'var(--letter-spacing-tight)',
        }}>
          衣橱概览
        </h2>
        
        <div className="cards-grid">
          {statCards.map((card, index) => (
            <div
              key={index}
              className="stat-card"
              style={{
                background: 'var(--color-secondary)',
                borderRadius: 'var(--radius-base)',
                padding: 'var(--spacing-8)',
                boxShadow: 'none',
                border: '1px solid var(--color-border)',
                transition: 'all var(--transition-base)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'var(--spacing-6)',
              }}>
                <div>
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}>
                    {card.description}
                  </p>
                  <h3 style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                    margin: 'var(--spacing-2) 0 0 0',
                    fontFamily: 'var(--font-family)',
                  }}>
                    {card.title}
                  </h3>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-primary)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'var(--color-text-light)',
                  fontSize: 'var(--font-size-lg)',
                  transition: 'all var(--transition-base)',
                }}>
                  {card.icon}
                </div>
              </div>
              
              <div style={{
                marginTop: 'var(--spacing-4)',
              }}>
                <Statistic
                  value={card.value}
                  valueStyle={{
                    fontSize: 'var(--font-size-4xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-primary)',
                    fontFamily: 'var(--font-family)',
                    textShadow: 'none',
                  }}
                  suffix={''}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 功能介绍区域 - 香奈儿简约风格 */}
      <div 
        ref={(el) => (animatedElementsRef.current[2] = el)} 
        className="scroll-animate"
        style={{
          marginTop: 'var(--spacing-16)',
        }}
      >
        <h2 style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-8)',
          fontFamily: 'var(--font-family)',
          letterSpacing: 'var(--letter-spacing-tight)',
        }}>
          核心功能
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--spacing-8)',
        }}>
          {
            [
              {
                title: '我的衣橱',
                description: '管理您的虚拟衣橱，轻松添加、编辑和分类您的衣物。',
                icon: <AppstoreOutlined />,
              },
              {
                title: '我的穿搭',
                description: '创建和管理您的穿搭方案，记录您的时尚风格。',
                icon: <BorderOutlined />,
              },
              {
                title: '智能推荐',
                description: '基于您的衣橱和偏好，获得个性化的穿搭推荐。',
                icon: <ShoppingOutlined />,
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="card"
                style={{
                  background: 'var(--color-secondary)',
                  borderRadius: 'var(--radius-base)',
                  padding: 'var(--spacing-10)',
                  boxShadow: 'none',
                  border: '1px solid var(--color-border)',
                  transition: 'all var(--transition-base)',
                }}
              >
                {/* 图标区域 */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-primary)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'var(--color-text-light)',
                  fontSize: 'var(--font-size-2xl)',
                  marginBottom: 'var(--spacing-6)',
                  transition: 'all var(--transition-base)',
                }}>
                  {feature.icon}
                </div>
                
                {/* 标题 */}
                <h3 style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-4)',
                  fontFamily: 'var(--font-family)',
                  letterSpacing: 'var(--letter-spacing-tight)',
                }}>
                  {feature.title}
                </h3>
                
                {/* 描述文本 */}
                <p style={{
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: 'var(--line-height-relaxed)',
                  fontSize: 'var(--font-size-base)',
                }}>
                  {feature.description}
                </p>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default Dashboard;