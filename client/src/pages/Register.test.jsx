import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Register from './Register.jsx';
import axios from 'axios';

// 模拟axios.post
export const mockedAxios = axios;
jest.mock('axios');

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render Register component', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /注\s*册/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/邮箱/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/请输入您的密码/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/请再次输入/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/用户名/i)).toBeInTheDocument();
  });

  it('should show validation error when email is empty', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    const registerButton = screen.getByRole('button', { name: /注\s*册/i });
    fireEvent.click(registerButton);
    
    // 验证表单验证错误是否触发
    await waitFor(() => {
      // 查找所有错误消息元素
      const errorElements = screen.getAllByText(/\s*请输入\s*/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('should show validation error when password is empty', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const registerButton = screen.getByRole('button', { name: /注\s*册/i });
    fireEvent.click(registerButton);
    
    // 使用findByRole获取表单错误信息
    await waitFor(() => {
      expect(screen.getByText(/请输入密码/i)).toBeInTheDocument();
    });
  });

  it('should show validation error when passwords do not match', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    const passwordInput = screen.getByPlaceholderText(/请输入您的密码/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/请再次输入/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different-password' } });
    
    const registerButton = screen.getByRole('button', { name: /注\s*册/i });
    fireEvent.click(registerButton);
    
    // 使用findByRole获取表单错误信息
    await waitFor(() => {
      expect(screen.getByText(/两次输入的密码不一致/i)).toBeInTheDocument();
    });
  });

  it('should call register API when form is submitted with valid data', async () => {
    // 模拟注册成功响应
    mockedAxios.post.mockResolvedValueOnce({
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

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    const passwordInput = screen.getByPlaceholderText(/请输入您的密码/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/请再次输入/i);
    const nameInput = screen.getByPlaceholderText(/用户名/i);
    const phoneInput = screen.getByPlaceholderText(/手机号/i);
    const registerButton = screen.getByRole('button', { name: /注\s*册/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    
    fireEvent.click(registerButton);
    
    // 验证API调用
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/users/register',
        expect.objectContaining({ 
          email: 'test@example.com', 
          password: 'password123',
          name: 'Test User',
          phone: '1234567890'
        })
      );
    });
  });

  it('should show error message when register fails', async () => {
    // 模拟注册失败响应
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: '该邮箱已被注册'
        }
      }
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    const passwordInput = screen.getByPlaceholderText(/请输入您的密码/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/请再次输入/i);
    const nameInput = screen.getByPlaceholderText(/用户名/i);
    const phoneInput = screen.getByPlaceholderText(/手机号/i);
    const registerButton = screen.getByRole('button', { name: /注\s*册/i });
    
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    
    fireEvent.click(registerButton);
    
    // 验证错误消息显示
    await waitFor(() => {
      expect(screen.getByText(/该邮箱已被注册/i)).toBeInTheDocument();
    });
  });

  it('should navigate to login page when login link is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>
    );
    
    const loginLink = screen.getByText(/已有账号/i).closest('a') || screen.getByRole('link', { name: /立即登录/i });
    
    // 验证链接的href属性是否正确
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});