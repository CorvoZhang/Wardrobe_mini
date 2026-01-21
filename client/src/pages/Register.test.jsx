import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Register from './Register.jsx';
import { AuthProvider } from '../utils/AuthContext.jsx';
import axios from 'axios';
import { message } from 'antd';

// 模拟axios
jest.mock('axios');

// 封装渲染函数，包含必要的Provider
const renderWithProviders = (ui, options = {}) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>,
    options
  );
};

const renderWithMemoryRouter = (ui, { initialEntries = ['/'], ...options } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </MemoryRouter>,
    options
  );
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('should render Register component with all elements', async () => {
    await act(async () => {
      renderWithProviders(<Register />);
    });
    
    // 检查注册按钮是否存在
    expect(screen.getByRole('button', { name: /注册/i })).toBeInTheDocument();
    // 检查所有输入框是否存在
    expect(screen.getByPlaceholderText(/请输入您的用户名/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/请输入您的邮箱/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/请输入您的手机号/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/请输入您的密码/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/请再次输入您的密码/i)).toBeInTheDocument();
  });

  it('should show validation error when email is empty', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      renderWithProviders(<Register />);
    });
    
    const registerButton = screen.getByRole('button', { name: /注册/i });
    
    await act(async () => {
      await user.click(registerButton);
    });
    
    // 等待表单验证错误显示
    await waitFor(() => {
      expect(screen.getByText(/请输入邮箱/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show validation error when password is empty', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      renderWithProviders(<Register />);
    });
    
    const emailInput = screen.getByPlaceholderText(/请输入您的邮箱/i);
    const nameInput = screen.getByPlaceholderText(/请输入您的用户名/i);
    const phoneInput = screen.getByPlaceholderText(/请输入您的手机号/i);
    
    await act(async () => {
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(phoneInput, '1234567890');
    });
    
    const registerButton = screen.getByRole('button', { name: /注册/i });
    
    await act(async () => {
      await user.click(registerButton);
    });
    
    // 等待表单验证错误显示
    await waitFor(() => {
      expect(screen.getByText(/请输入密码/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      renderWithProviders(<Register />);
    });
    
    const nameInput = screen.getByPlaceholderText(/请输入您的用户名/i);
    const emailInput = screen.getByPlaceholderText(/请输入您的邮箱/i);
    const phoneInput = screen.getByPlaceholderText(/请输入您的手机号/i);
    const passwordInput = screen.getByPlaceholderText(/请输入您的密码/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/请再次输入您的密码/i);
    
    await act(async () => {
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(phoneInput, '1234567890');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different-password');
    });
    
    const registerButton = screen.getByRole('button', { name: /注册/i });
    
    await act(async () => {
      await user.click(registerButton);
    });
    
    // 等待表单验证错误显示
    await waitFor(() => {
      expect(screen.getByText(/两次输入的密码不一致/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show validation error when username is empty', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      renderWithProviders(<Register />);
    });
    
    const registerButton = screen.getByRole('button', { name: /注册/i });
    
    await act(async () => {
      await user.click(registerButton);
    });
    
    // 等待表单验证错误显示
    await waitFor(() => {
      expect(screen.getByText(/请输入用户名/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should call register API when form is submitted with valid data', async () => {
    const user = userEvent.setup();
    
    // 模拟注册成功响应
    axios.post.mockResolvedValueOnce({
      data: {
        message: '注册成功',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          phone: '1234567890'
        },
        token: 'test-token'
      }
    });

    await act(async () => {
      renderWithProviders(<Register />);
    });
    
    const nameInput = screen.getByPlaceholderText(/请输入您的用户名/i);
    const emailInput = screen.getByPlaceholderText(/请输入您的邮箱/i);
    const phoneInput = screen.getByPlaceholderText(/请输入您的手机号/i);
    const passwordInput = screen.getByPlaceholderText(/请输入您的密码/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/请再次输入您的密码/i);
    const registerButton = screen.getByRole('button', { name: /注册/i });
    
    await act(async () => {
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(phoneInput, '1234567890');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
    });
    
    await act(async () => {
      await user.click(registerButton);
    });
    
    // 验证API调用
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/users/register',
        expect.objectContaining({ 
          email: 'test@example.com', 
          password: 'password123',
          name: 'Test User',
          phone: '1234567890'
        })
      );
    }, { timeout: 3000 });
  });

  it('should show error message when register fails', async () => {
    const user = userEvent.setup();
    
    // 模拟注册失败响应
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: '该邮箱已被注册'
        }
      }
    });

    await act(async () => {
      renderWithProviders(<Register />);
    });
    
    const nameInput = screen.getByPlaceholderText(/请输入您的用户名/i);
    const emailInput = screen.getByPlaceholderText(/请输入您的邮箱/i);
    const phoneInput = screen.getByPlaceholderText(/请输入您的手机号/i);
    const passwordInput = screen.getByPlaceholderText(/请输入您的密码/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/请再次输入您的密码/i);
    const registerButton = screen.getByRole('button', { name: /注册/i });
    
    await act(async () => {
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'existing@example.com');
      await user.type(phoneInput, '1234567890');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
    });
    
    await act(async () => {
      await user.click(registerButton);
    });
    
    // 验证 message.error 被调用
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('该邮箱已被注册');
    }, { timeout: 3000 });
  });

  it('should navigate to login page when login link is clicked', async () => {
    await act(async () => {
      renderWithMemoryRouter(<Register />, { initialEntries: ['/register'] });
    });
    
    // 查找包含"立即登录"文本的链接
    const loginLink = screen.getByText(/立即登录/i);
    
    // 验证链接的href属性是否正确
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });
});
