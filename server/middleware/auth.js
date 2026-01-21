import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// JWT 密钥 - 生产环境必须通过环境变量配置
// 开发环境使用默认值，生产环境如果未配置会报错
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// 生产环境检查
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('❌ 错误: 生产环境必须配置 JWT_SECRET 环境变量');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.log('⚠️ JWT_SECRET 未配置，使用开发环境默认值（仅限本地开发）');
}

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