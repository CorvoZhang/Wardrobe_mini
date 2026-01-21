# Express JWT 认证中间件

## 概述

JWT (JSON Web Token) 是一种用于在各方之间安全传输信息的开放标准。本文档总结了在 Express 应用中实现 JWT 认证的完整方案。

## 适用场景

- RESTful API 认证
- 无状态会话管理
- 前后端分离架构
- 移动端 API 认证
- 微服务间认证

## 核心实现

### 1. 安装依赖

```bash
npm install jsonwebtoken bcryptjs
```

### 2. 认证中间件

```javascript
// middleware/auth.js
import jwt from 'jsonwebtoken';

// 从环境变量获取密钥（生产环境必须配置）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 认证中间件 - 验证 JWT Token
 */
export const authenticate = (req, res, next) => {
  try {
    // 1. 从请求头获取 token
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        message: '未提供认证令牌' 
      });
    }

    // 2. 提取 token（移除 Bearer 前缀）
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: '认证令牌格式错误' 
      });
    }

    // 3. 验证 token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 4. 将用户信息添加到请求对象
    req.user = decoded;
    next();
    
  } catch (error) {
    // 5. 处理不同类型的 JWT 错误
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: '无效的认证令牌' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: '认证令牌已过期' 
      });
    }
    return res.status(500).json({ 
      success: false,
      message: '认证过程中发生错误' 
    });
  }
};

/**
 * 生成 JWT 令牌
 */
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      // 可以添加其他非敏感信息
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * 可选认证中间件 - 有 token 则验证，无 token 也放行
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // 忽略错误，继续执行
  }
  next();
};
```

### 3. 用户注册与登录

```javascript
// routes/userRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * 用户注册
 * POST /api/users/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 1. 验证输入
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false,
        message: '请填写所有必填字段' 
      });
    }

    // 2. 检查邮箱是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: '该邮箱已被注册' 
      });
    }

    // 3. 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. 创建用户
    const user = await User.create({
      email,
      password: hashedPassword,
      name
    });

    // 5. 生成 token
    const token = generateToken(user);

    // 6. 返回用户信息（不包含密码）
    res.status(201).json({
      success: true,
      message: '注册成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });

  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ 
      success: false,
      message: '注册失败，请稍后重试' 
    });
  }
});

/**
 * 用户登录
 * POST /api/users/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. 验证输入
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: '请输入邮箱和密码' 
      });
    }

    // 2. 查找用户
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: '邮箱或密码错误' 
      });
    }

    // 3. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: '邮箱或密码错误' 
      });
    }

    // 4. 生成 token
    const token = generateToken(user);

    // 5. 返回用户信息
    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ 
      success: false,
      message: '登录失败，请稍后重试' 
    });
  }
});

/**
 * 获取当前用户信息
 * GET /api/users/profile
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: '用户不存在' 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ 
      success: false,
      message: '获取用户信息失败' 
    });
  }
});

export default router;
```

### 4. 在路由中使用中间件

```javascript
// routes/clothingRoutes.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Clothing from '../models/Clothing.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取用户的衣物列表
router.get('/', async (req, res) => {
  try {
    // req.user 由中间件注入，包含用户信息
    const clothing = await Clothing.findAll({
      where: { userId: req.user.id }
    });
    res.json(clothing);
  } catch (error) {
    res.status(500).json({ message: '获取失败' });
  }
});

// 创建衣物
router.post('/', async (req, res) => {
  try {
    const clothing = await Clothing.create({
      ...req.body,
      userId: req.user.id  // 使用中间件注入的用户ID
    });
    res.status(201).json(clothing);
  } catch (error) {
    res.status(500).json({ message: '创建失败' });
  }
});

export default router;
```

## 高级配置

### 1. 角色权限控制

```javascript
/**
 * 角色授权中间件
 * @param {string[]} roles - 允许的角色列表
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '未认证' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: '无权限访问此资源' 
      });
    }
    
    next();
  };
};

// 使用示例
router.delete('/users/:id', 
  authenticate, 
  authorize('admin'), 
  deleteUser
);

router.get('/reports', 
  authenticate, 
  authorize('admin', 'manager'), 
  getReports
);
```

### 2. Refresh Token 机制

```javascript
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';

// 生成 token 对
export const generateTokenPair = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES }
  );
  
  return { accessToken, refreshToken };
};

// 刷新 token 路由
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: '未提供刷新令牌' });
    }
    
    // 验证 refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    // 生成新的 token 对
    const tokens = generateTokenPair(user);
    
    res.json(tokens);
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '刷新令牌已过期，请重新登录' });
    }
    return res.status(401).json({ message: '无效的刷新令牌' });
  }
});
```

### 3. Token 黑名单（登出）

```javascript
// 使用 Redis 存储黑名单
import Redis from 'ioredis';
const redis = new Redis();

// 将 token 加入黑名单
export const blacklistToken = async (token, expiresIn) => {
  await redis.setex(`blacklist:${token}`, expiresIn, 'true');
};

// 检查 token 是否在黑名单中
export const isTokenBlacklisted = async (token) => {
  const result = await redis.get(`blacklist:${token}`);
  return result === 'true';
};

// 修改认证中间件
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    // 检查黑名单
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ message: '令牌已失效' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.token = token;
    next();
    
  } catch (error) {
    return res.status(401).json({ message: '认证失败' });
  }
};

// 登出路由
router.post('/logout', authenticate, async (req, res) => {
  try {
    // 获取 token 剩余有效期
    const decoded = jwt.decode(req.token);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    // 加入黑名单
    if (expiresIn > 0) {
      await blacklistToken(req.token, expiresIn);
    }
    
    res.json({ message: '登出成功' });
  } catch (error) {
    res.status(500).json({ message: '登出失败' });
  }
});
```

## 环境变量配置

```bash
# .env
JWT_SECRET=your-super-secret-key-at-least-32-characters
JWT_EXPIRES_IN=7d

# Refresh Token (可选)
ACCESS_TOKEN_SECRET=access-token-secret-key
REFRESH_TOKEN_SECRET=refresh-token-secret-key
```

## 最佳实践

### 1. 密钥管理

```javascript
// ❌ 不要硬编码密钥
const JWT_SECRET = 'my-secret';

// ✅ 从环境变量读取，并验证
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 环境变量未配置');
}
```

### 2. 不要在 Token 中存储敏感信息

```javascript
// ❌ 不要存储敏感信息
jwt.sign({ 
  id: user.id, 
  password: user.password,  // 绝对不要！
  creditCard: user.card     // 绝对不要！
}, secret);

// ✅ 只存储必要的标识信息
jwt.sign({ 
  id: user.id, 
  email: user.email,
  role: user.role 
}, secret);
```

### 3. 统一错误响应格式

```javascript
// 自定义认证错误类
class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}

// 在中间件中使用
export const authenticate = (req, res, next) => {
  try {
    // ... 验证逻辑
  } catch (error) {
    next(new AuthError('认证失败'));
  }
};

// 全局错误处理
app.use((error, req, res, next) => {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.name,
      message: error.message
    });
  }
  // 处理其他错误...
});
```

## 常见问题

### Q: Access Token 有效期应该设多长？

| 场景 | 推荐有效期 |
|------|-----------|
| 高安全性（银行、支付） | 15分钟 + Refresh Token |
| 一般应用 | 1-7天 |
| 低安全性/便利优先 | 30天 |

### Q: JWT vs Session？

| 特性 | JWT | Session |
|------|-----|---------|
| 存储位置 | 客户端 | 服务端 |
| 扩展性 | 易水平扩展 | 需要共享存储 |
| 安全性 | 无法主动失效 | 可随时撤销 |
| 适用场景 | API、微服务 | 传统 Web 应用 |

---

## 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2026-01-20 | 初始化文档 |
