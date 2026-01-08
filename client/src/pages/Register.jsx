import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserAddOutlined, UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 调用注册API
      const response = await axios.post('http://localhost:5001/api/users/register', values);
      message.success(response.data.message || '注册成功，请登录');
      navigate('/login');
    } catch (error) {
      message.error(error.response?.data?.message || '注册失败，请稍后重试');
      console.error('注册失败:', error);
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
            创建您的账号，开启时尚之旅
          </p>
        </div>

        {/* 注册表单 */}
        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名!' }]}
            labelCol={{ style: { marginBottom: 'var(--spacing-2)' } }}
          >
            <Input
              id="register_name"
              prefix={<UserOutlined style={{ color: 'var(--color-accent)' }} />}
              placeholder="请输入您的用户名"
              autoComplete="name"
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
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱!' }, { type: 'email', message: '请输入有效的邮箱地址!' }]}
            labelCol={{ style: { marginBottom: 'var(--spacing-2)' } }}
          >
            <Input
              id="register_email"
              prefix={<MailOutlined style={{ color: 'var(--color-accent)' }} />}
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
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号!' }]}
            labelCol={{ style: { marginBottom: 'var(--spacing-2)' } }}
          >
            <Input
              id="register_phone"
              prefix={<PhoneOutlined style={{ color: 'var(--color-accent)' }} />}
              placeholder="请输入您的手机号"
              autoComplete="tel"
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
              id="register_password"
              prefix={<LockOutlined style={{ color: 'var(--color-accent)' }} />}
              placeholder="请输入您的密码"
              autoComplete="new-password"
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
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'));
                },
              }),
            ]}
            labelCol={{ style: { marginBottom: 'var(--spacing-2)' } }}
          >
            <Input.Password
              id="register_confirmPassword"
              prefix={<LockOutlined style={{ color: 'var(--color-accent)' }} />}
              placeholder="请再次输入您的密码"
              autoComplete="new-password"
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
              size="large"
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
              <UserAddOutlined /> 注册
            </Button>
          </Form.Item>

          {/* 登录链接 */}
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
              已有账号？
              <a
                href="/login"
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
                立即登录
              </a>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Register;