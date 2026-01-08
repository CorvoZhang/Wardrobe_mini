import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { LoginOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext.jsx';
import axios from 'axios';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 调用登录API
      const response = await axios.post('http://localhost:5001/api/users/login', values);
      message.success(response.data.message || '登录成功');
      // 使用AuthContext的login函数保存认证信息
      if (response.data.token) {
        login(response.data.user, response.data.token);
      }
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败，请检查邮箱和密码');
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-dark) 100%)',
      padding: 'var(--spacing-4)',
    }}>
      <div className="page-transition" style={{
        backgroundColor: 'var(--color-secondary)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-8)',
        boxShadow: 'var(--shadow-xl)',
        width: '100%',
        maxWidth: '450px',
      }}>
        {/* 标题 */}
        <div style={{
          textAlign: 'center',
          marginBottom: 'var(--spacing-8)',
        }}>
          <div style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-primary)',
            marginBottom: 'var(--spacing-2)',
          }}>
            <span style={{ color: 'var(--color-accent)', marginRight: 'var(--spacing-2)' }}>✨</span>
            衣橱管家
          </div>
          <p style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}>
            登录您的账号，开始探索时尚世界
          </p>
        </div>

        {/* 登录表单 */}
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱!' }, { type: 'email', message: '请输入有效的邮箱地址!' }]}
            labelCol={{ style: { marginBottom: 'var(--spacing-2)' } }}
          >
            <Input
              id="login_email"
              prefix={<UserOutlined style={{ color: 'var(--color-accent)' }} />}
              placeholder="请输入您的邮箱"
              autoComplete="email"
              style={{
                borderRadius: 'var(--radius-base)',
                padding: 'var(--spacing-3)',
                fontSize: 'var(--font-size-base)',
                borderColor: 'var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码!' }, { min: 6, message: '密码长度不能少于6位' }]}
            labelCol={{ style: { marginBottom: 'var(--spacing-2)' } }}
          >
            <Input.Password
              id="login_password"
              prefix={<LockOutlined style={{ color: 'var(--color-accent)' }} />}
              placeholder="请输入您的密码"
              autoComplete="current-password"
              style={{
                borderRadius: 'var(--radius-base)',
                padding: 'var(--spacing-3)',
                fontSize: 'var(--font-size-base)',
                borderColor: 'var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                padding: 'var(--spacing-3)',
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
              <LoginOutlined /> 登录
            </Button>
          </Form.Item>

          {/* 注册链接 */}
          <div style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-6)',
            paddingTop: 'var(--spacing-6)',
            borderTop: '1px solid var(--color-border)',
          }}>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-base)',
              margin: 0,
            }}>
              没有账号？
              <a
                href="/register"
                style={{
                  color: 'var(--color-accent)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginLeft: 'var(--spacing-1)',
                  textDecoration: 'none',
                  transition: 'color var(--transition-base)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
              >
                立即注册
              </a>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;