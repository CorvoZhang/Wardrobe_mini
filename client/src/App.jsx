import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import { UserOutlined, AppstoreOutlined, BorderOutlined, ShoppingOutlined, BgColorsOutlined } from '@ant-design/icons';
import './App.css';
import { useAuth } from './utils/AuthContext.jsx';
import { useTheme } from './utils/ThemeContext.jsx';

// 页面组件
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Closet from './pages/Closet';
import ClothingDetail from './pages/ClothingDetail';
import AddClothing from './pages/AddClothing';
import Outfits from './pages/Outfits';
import OutfitDetail from './pages/OutfitDetail';
import AddOutfit from './pages/AddOutfit';
import Recommendations from './pages/Recommendations';

function App() {
  return (
    <Router>
      <Routes>
        {/* 公共路由 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 主应用路由 */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="closet" element={<Closet />} />
          <Route path="closet/add" element={<AddClothing />} />
          <Route path="clothing/:id" element={<ClothingDetail />} />
          <Route path="outfits" element={<Outfits />} />
          <Route path="outfits/create" element={<AddOutfit />} />
          <Route path="outfit/:id" element={<OutfitDetail />} />
          <Route path="recommendations" element={<Recommendations />} />
        </Route>
      </Routes>
    </Router>
  );
}

// 主布局组件
function MainLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleMenuClick = (e) => {
    const { key } = e;
    const menuItem = [
      {
        key: '1',
        path: '/',
      },
      {
        key: '2',
        path: '/closet',
      },
      {
        key: '3',
        path: '/outfits',
      },
      {
        key: '4',
        path: '/recommendations',
      },
    ].find(item => item.key === key);
    
    if (menuItem) {
      navigate(menuItem.path);
    }
  };

  return (
    <div className="app-container">
      {/* 顶部导航栏 - 香奈儿简约风格 */}
      <header style={{
          background: `var(--color-secondary)`,
          boxShadow: `none`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: `0 var(--spacing-8)`,
          borderBottom: `1px solid var(--color-border)`,
        }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '80px',
        }}>
          {/* Logo - 香奈儿简约设计 */}
          <div style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'var(--font-family)',
            letterSpacing: 'var(--letter-spacing-tight)',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'opacity var(--transition-base)',
          }}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}>
            <span style={{ 
              color: 'var(--color-primary)', 
              marginRight: 'var(--spacing-2)',
              fontSize: 'var(--font-size-2xl)',
            }}>CHANEL</span>
            <span style={{ 
              color: 'var(--color-primary)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-regular)',
            }}>
              CLOSET
            </span>
          </div>
          
          {/* 导航菜单 - 香奈儿简约设计 */}
          <nav>
            <ul style={{
              display: 'flex',
              listStyle: 'none',
              gap: 'var(--spacing-8)',
              margin: 0,
              padding: 0,
            }}>
              {
                [
                  { key: '1', label: '个人中心', path: '/', icon: <UserOutlined /> },
                  { key: '2', label: '我的衣橱', path: '/closet', icon: <AppstoreOutlined /> },
                  { key: '3', label: '我的穿搭', path: '/outfits', icon: <BorderOutlined /> },
                  { key: '4', label: '智能推荐', path: '/recommendations', icon: <ShoppingOutlined /> },
                ].map(item => {
                  const isActive = window.location.pathname === item.path;
                  return (
                    <li key={item.key}>
                      <a
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(item.path);
                      }}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2)',
                        padding: 'var(--spacing-2) 0',
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        textDecoration: 'none',
                        fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                        transition: 'all var(--transition-base)',
                        position: 'relative',
                        fontSize: 'var(--font-size-base)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }
                      }}
                    >
                      <span style={{
                        fontSize: 'var(--font-size-lg)',
                        color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        transition: 'color var(--transition-base)',
                      }}>
                        {item.icon}
                      </span>
                      <span>
                        {item.label}
                      </span>
                      {isActive && (
                        <span style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'var(--color-accent)',
                        }}></span>
                      )}
                    </a>
                    </li>
                  );
                })
              }
            </ul>
          </nav>
          
          {/* 用户菜单 - 香奈儿简约设计 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-4)',
          }}>
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                padding: 'var(--spacing-2) var(--spacing-4)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
                e.currentTarget.style.color = 'var(--color-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
            >
              <BgColorsOutlined />
              {theme === 'chanel' ? '时尚现代' : '经典香奈儿'}
            </button>
            <button
              onClick={() => {
                // 登出逻辑
                logout();
                navigate('/login');
              }}
              style={{
                padding: 'var(--spacing-2) var(--spacing-6)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-light)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              登出
            </button>
          </div>
        </div>
      </header>
      
      {/* 主要内容区域 */}
      <main className="content-area">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
      
      {/* 页脚 - 香奈儿简约风格 */}
      <footer style={{
        background: 'var(--color-primary)',
        color: 'var(--color-text-light)',
        padding: 'var(--spacing-12) var(--spacing-8)',
        marginTop: 'var(--spacing-16)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-12)',
        }}>
          {/* 品牌信息 */}
          <div>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'var(--font-family)',
              letterSpacing: 'var(--letter-spacing-tight)',
              marginBottom: 'var(--spacing-6)',
            }}>
              <span style={{ 
                color: 'var(--color-accent)', 
                marginRight: 'var(--spacing-2)',
                fontSize: 'var(--font-size-3xl)',
              }}>CHANEL</span>
              <span style={{ 
                color: 'var(--color-text-light)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-regular)',
              }}>
                CLOSET
              </span>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: 'var(--line-height-relaxed)',
              marginBottom: 'var(--spacing-6)',
              fontSize: 'var(--font-size-sm)',
            }}>
              打造您的专属时尚风格，让穿搭成为一种生活态度。
            </p>
          </div>
          
          {/* 快速链接 */}
          <div>
            <h3 style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-4)',
              fontFamily: 'var(--font-family-sans)',
              letterSpacing: 'var(--letter-spacing-tight)',
              textTransform: 'uppercase',
            }}>
              快速链接
            </h3>
            <ul style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}>
              {[
                { label: '个人中心', path: '/' },
                { label: '我的衣橱', path: '/closet' },
                { label: '我的穿搭', path: '/outfits' },
                { label: '智能推荐', path: '/recommendations' },
              ].map((item, index) => (
                <li key={index} style={{ marginBottom: 'var(--spacing-3)' }}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.path);
                    }}
                    style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      textDecoration: 'none',
                      transition: 'all var(--transition-base)',
                      display: 'inline-block',
                      padding: 'var(--spacing-1) 0',
                      fontSize: 'var(--font-size-sm)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* 联系我们 */}
          <div>
            <h3 style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-4)',
              fontFamily: 'var(--font-family-sans)',
              letterSpacing: 'var(--letter-spacing-tight)',
              textTransform: 'uppercase',
            }}>
              联系我们
            </h3>
            <ul style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}>
              {[
                { icon: '📧', text: 'contact@chanelcloset.com' },
                { icon: '📱', text: '+86 123 4567 8910' },
                { icon: '📍', text: '北京市朝阳区时尚大厦1001室' },
              ].map((item, index) => (
                <li key={index} style={{
                  marginBottom: 'var(--spacing-3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: 'var(--font-size-sm)',
                }}>
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* 版权信息 */}
        <div style={{
          maxWidth: '1400px',
          margin: 'var(--spacing-8) auto 0',
          paddingTop: 'var(--spacing-6)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: 'var(--font-size-xs)',
        }}>
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} CHANEL CLOSET. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;