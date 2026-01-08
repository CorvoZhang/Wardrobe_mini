import jwt from 'jsonwebtoken';

// JWT密钥，实际项目中应使用环境变量
const JWT_SECRET = 'your-secret-key-change-me-in-production';

// 认证中间件
export const authenticate = (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    // 提取token（移除Bearer前缀）
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '认证令牌格式错误' });
    }

    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 将用户信息添加到请求对象
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的认证令牌' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '认证令牌已过期' });
    }
    return res.status(500).json({ message: '认证过程中发生错误' });
  }
};

// 生成JWT令牌
export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' } // 令牌有效期7天
  );
};