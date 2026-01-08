import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Login from './Login.jsx';
import { AuthProvider } from '../utils/AuthContext.jsx';
import axios from 'axios';

// 模拟axios.post
export const mockedAxios = axios;
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
  });

  it('should render Login component', () => {
    renderWithProviders(<Login />);
    expect(screen.getByRole('button', { name: /登\s*录/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/邮箱/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/密码/i)).toBeInTheDocument();
  });

  it('should show validation error when email is empty', async () => {
    renderWithProviders(<Login />);
    
    const loginButton = screen.getByRole('button', { name: /登\s*录/i });
    fireEvent.click(loginButton);
    
    // 验证表单验证错误是否触发
    await waitFor(() => {
      // 查找所有错误消息元素
      const errorElements = screen.getAllByText(/\s*请输入\s*/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('should show validation error when password is empty', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const loginButton = screen.getByRole('button', { name: /登\s*录/i });
    fireEvent.click(loginButton);
    
    // 验证表单验证错误是否触发
    await waitFor(() => {
      // 查找所有错误消息元素
      const errorElements = screen.getAllByText(/\s*请输入\s*/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('should show validation error when email format is invalid', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const loginButton = screen.getByRole('button', { name: /登\s*录/i });
    fireEvent.click(loginButton);
    
    // 验证表单验证错误是否触发
    await waitFor(() => {
      // 查找所有错误消息元素
      const errorElements = screen.getAllByText(/\s*邮箱\s*/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('should call login API when form is submitted with valid data', async () => {
    // 模拟登录成功响应
    mockedAxios.post.mockResolvedValueOnce({
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

    renderWithProviders(<Login />);
    
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    const passwordInput = screen.getByPlaceholderText(/密码/i);
    const loginButton = screen.getByRole('button', { name: /登\s*录/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);
    
    // 验证API调用
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/users/login',
        { email: 'test@example.com', password: 'password123' }
      );
    });
  });

  it('should show error message when login fails', async () => {
    // 模拟登录失败响应
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: '邮箱或密码错误'
        }
      }
    });

    renderWithProviders(<Login />);
    
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    const passwordInput = screen.getByPlaceholderText(/密码/i);
    const loginButton = screen.getByRole('button', { name: /登\s*录/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(loginButton);
    
    // 验证错误消息显示
    await waitFor(() => {
      expect(screen.getByText(/邮箱或密码错误/i)).toBeInTheDocument();
    });
  });

  it('should navigate to register page when register link is clicked', () => {
    renderWithMemoryRouter(<Login />, { initialEntries: ['/login'] });
    
    const registerLink = screen.getByText(/没有账号/i).closest('a') || screen.getByRole('link', { name: /立即注册/i });
    
    // 验证链接的href属性是否正确
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});