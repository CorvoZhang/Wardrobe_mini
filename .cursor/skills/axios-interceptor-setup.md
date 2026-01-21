# Axios 请求拦截器配置

## 概述

Axios 拦截器允许在请求发送前和响应返回后进行统一处理，是前端 HTTP 请求管理的核心模式。本文档总结了完整的拦截器配置方案。

## 适用场景

- 自动注入 JWT Token 到请求头
- 统一处理 HTTP 错误响应
- 401 未授权自动跳转登录
- 请求/响应日志记录
- 加载状态管理
- 请求重试机制

## 核心实现

### 完整配置模板

```javascript
// utils/axiosConfig.js
import axios from 'axios';

// 从环境变量获取 API 地址
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== 请求拦截器 ====================
axiosInstance.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token');
    if (token) {
      // 添加 Authorization 头
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 可以在这里添加其他通用请求头
    // config.headers['X-Request-Id'] = generateRequestId();
    
    return config;
  },
  (error) => {
    // 处理请求配置错误
    console.error('请求配置错误:', error);
    return Promise.reject(error);
  }
);

// ==================== 响应拦截器 ====================
axiosInstance.interceptors.response.use(
  (response) => {
    // 成功响应：直接返回数据部分
    return response.data;
  },
  (error) => {
    // 统一处理响应错误
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 未授权：清除 token 并跳转登录
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // 避免在登录页重复跳转
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          console.error('禁止访问:', data.message);
          break;
          
        case 404:
          console.error('资源不存在:', data.message);
          break;
          
        case 422:
          // 验证错误
          console.error('验证错误:', data.errors);
          break;
          
        case 500:
          console.error('服务器错误:', data.message);
          break;
          
        default:
          console.error('请求错误:', data.message);
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
```

### 在组件中使用

```jsx
import axiosInstance from '../utils/axiosConfig';

// GET 请求
const fetchData = async () => {
  try {
    // 拦截器已处理，直接获得 data
    const data = await axiosInstance.get('/users/profile');
    setUser(data);
  } catch (error) {
    // 错误已在拦截器中处理
    message.error(error.response?.data?.message || '获取失败');
  }
};

// POST 请求
const createItem = async (payload) => {
  try {
    const result = await axiosInstance.post('/items', payload);
    message.success('创建成功');
    return result;
  } catch (error) {
    message.error(error.response?.data?.message || '创建失败');
    throw error;
  }
};
```

## 高级配置

### 1. 请求重试机制

```javascript
import axios from 'axios';

const axiosInstance = axios.create({ /* ... */ });

// 重试配置
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const config = error.config;
    
    // 初始化重试计数
    config.__retryCount = config.__retryCount || 0;
    
    // 只对网络错误和 5xx 错误重试
    const shouldRetry = 
      !error.response || 
      (error.response.status >= 500 && error.response.status < 600);
    
    if (shouldRetry && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;
      
      // 延迟后重试
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      
      console.log(`重试请求 (${config.__retryCount}/${MAX_RETRIES}):`, config.url);
      return axiosInstance(config);
    }
    
    return Promise.reject(error);
  }
);
```

### 2. Token 刷新机制

```javascript
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 正在刷新 token，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        
        localStorage.setItem('token', data.token);
        axiosInstance.defaults.headers.Authorization = `Bearer ${data.token}`;
        
        processQueue(null, data.token);
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 3. 请求取消（AbortController）

```javascript
// 创建带取消功能的请求
export const createCancelableRequest = () => {
  const controller = new AbortController();
  
  return {
    request: (config) => axiosInstance({
      ...config,
      signal: controller.signal,
    }),
    cancel: () => controller.abort(),
  };
};

// 使用示例
const { request, cancel } = createCancelableRequest();

useEffect(() => {
  request({ url: '/api/data' })
    .then(data => setData(data))
    .catch(err => {
      if (axios.isCancel(err)) {
        console.log('请求已取消');
      }
    });
  
  // 组件卸载时取消请求
  return () => cancel();
}, []);
```

### 4. 加载状态管理

```javascript
// 全局加载状态计数
let activeRequests = 0;

// 加载状态回调（可以连接到全局状态管理）
let setGlobalLoading = () => {};

export const setLoadingCallback = (callback) => {
  setGlobalLoading = callback;
};

axiosInstance.interceptors.request.use((config) => {
  activeRequests++;
  setGlobalLoading(true);
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    activeRequests--;
    if (activeRequests === 0) setGlobalLoading(false);
    return response.data;
  },
  (error) => {
    activeRequests--;
    if (activeRequests === 0) setGlobalLoading(false);
    return Promise.reject(error);
  }
);
```

## 环境变量配置

```bash
# .env.development
VITE_API_URL=http://localhost:5001/api

# .env.production
VITE_API_URL=https://api.example.com/api
```

## 最佳实践

### 1. 创建无认证的公共实例

```javascript
// 用于无需 token 的公开接口
export const publicAxios = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// 用于分享页面等公开访问
const response = await publicAxios.get(`/outfits/shared/${shareCode}`);
```

### 2. 不同超时配置

```javascript
// 文件上传使用更长的超时
export const uploadAxios = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60秒
});

uploadAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. 错误消息提取辅助函数

```javascript
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errors) {
    return Object.values(error.response.data.errors).flat().join(', ');
  }
  if (error.message) {
    return error.message;
  }
  return '未知错误';
};

// 使用
try {
  await axiosInstance.post('/api/action');
} catch (error) {
  message.error(getErrorMessage(error));
}
```

## 常见问题

### Q: 为什么响应拦截器返回 `response.data`？

这样可以在业务代码中直接获取数据，无需每次都写 `response.data`：

```javascript
// 有拦截器处理
const users = await axiosInstance.get('/users'); // 直接是数据

// 无拦截器处理
const response = await axios.get('/users');
const users = response.data; // 需要额外一步
```

### Q: 如何处理文件下载？

```javascript
const downloadFile = async (url, filename) => {
  const response = await axiosInstance.get(url, {
    responseType: 'blob',
    // 对于 blob 响应，不要在拦截器中处理
  });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(response);
  link.download = filename;
  link.click();
};
```

---

## 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2026-01-20 | 初始化文档 |
