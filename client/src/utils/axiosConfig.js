import axios from 'axios';

// 从环境变量获取 API 地址，提供默认值用于本地开发
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// 创建axios实例
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      // 添加Authorization头
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    // 直接返回响应数据
    return response.data;
  },
  (error) => {
    // 统一处理响应错误
    if (error.response) {
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          // 禁止访问
          console.error('禁止访问:', error.response.data.message);
          break;
        case 404:
          // 资源不存在
          console.error('资源不存在:', error.response.data.message);
          break;
        case 500:
          // 服务器错误
          console.error('服务器错误:', error.response.data.message);
          break;
        default:
          // 其他错误
          console.error('请求错误:', error.response.data.message);
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误，服务器无响应');
    } else {
      // 请求配置错误
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
