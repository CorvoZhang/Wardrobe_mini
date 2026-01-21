import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Login from './Login.jsx';
import { AuthProvider } from '../utils/AuthContext.jsx';
import axios from 'axios';
import { message } from 'antd';

// 模拟axios
jest.mock('axios');

// 封装渲染函数，包含必要的Provider
const renderWithProviders = (ui, { route = '/', ...options } = {}) => {
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

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 清理 localStorage
    window.localStorage.clear();
  });

  it('should render Login component with all elements', async () => {
    await act(async () => {
      renderWithProviders(<Login />);
    });
    
    // 检查登录按钮是否存在
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
    // 检查邮箱输入框是否存在
    expect(screen.getByPlaceholderText(/请输入您的邮箱/i)).toBeInTheDocument();
    // 检查密码输入框是否存在
    expect(screen.getByPlaceholderText(/请输入您的密码/i)).toBeInTheDocument();
  });

  it('should show validation error when email is empty', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      renderWithProviders(<Login />);
    });
    
    const loginButton = screen.getByRole('button', { name: /登录/i });
    
    await act(async () => {
      await user.click(loginButton);
    });
    
    // 等待表单验证错误显示
    await waitFor(() => {
      expect(screen.getByText(/请输入邮箱/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show validation error when password is empty', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      renderWithProviders(<Login />);
    });
    
    const emailInput = screen.getByPlaceholderText(/请输入您的邮箱/i);
    
    await act(async () => {
      await user.type(emailInput, 'test@example.com');
    });
    
    const loginButton = screen.getByRole('button', { name: /登录/i });
    
    await act(async () => {
      await user.click(loginButton);
    });
    
    // 等待表单验证错误显示
    await waitFor(() => {
      expect(screen.getByText(/请输入密码/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show validation error when email format is invalid', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      renderWithProviders(<Login />);
    });
    
    const emailInput = screen.getByPlaceholderText(/请输入您的邮箱/i);
    
    await act(async () => {
      await user.type(emailInput, 'invalid-email');
    });
    
    const loginButton = screen.getByRole('button', { name: /登录/i });
    
    await act(async () => {
      await user.click(loginButton);
    });
    
    // 等待表单验证错误显示
    await waitFor(() => {
      expect(screen.getByText(/请输入有效的邮箱地址/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should call login API when form is submitted with valid data', async () => {
    const user = userEvent.setup();
    
    // 模拟登录成功响应
    axios.post.mockResolvedValueOnce({
      data: {
        message: '登录成功',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        },
        token: 'test-token'
      }
    });

    await act(async () => {
      renderWithProviders(<Login />);
    });
    
    const emailInput = screen.getByPlaceholderText(/请输入您的邮箱/i);
    const passwordInput = screen.getByPlaceholderText(/请输入您的密码/i);
    const loginButton = screen.getByRole('button', { name: /登录/i });
    
    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
    });
    
    await act(async () => {
      await user.click(loginButton);
    });
    
    // 验证API调用
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/users/login',
        { email: 'test@example.com', password: 'password123' }
      );
    }, { timeout: 3000 });
  });

  it('should show error message when login fails', async () => {
    const user = userEvent.setup();
    
    // 模拟登录失败响应
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: '邮箱或密码错误'
        }
      }
    });

    await act(async () => {
      renderWithProviders(<Login />);
    });
    
    const emailInput = screen.getByPlaceholderText(/请输入您的邮箱/i);
    const passwordInput = screen.getByPlaceholderText(/请输入您的密码/i);
    const loginButton = screen.getByRole('button', { name: /登录/i });
    
    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrong-password');
    });
    
    await act(async () => {
      await user.click(loginButton);
    });
    
    // 验证 message.error 被调用
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('邮箱或密码错误');
    }, { timeout: 3000 });
  });

  it('should navigate to register page when register link is clicked', async () => {
    await act(async () => {
      renderWithMemoryRouter(<Login />, { initialEntries: ['/login'] });
    });
    
    // 查找包含"立即注册"文本的链接
    const registerLink = screen.getByText(/立即注册/i);
    
    // 验证链接的href属性是否正确
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });
});
