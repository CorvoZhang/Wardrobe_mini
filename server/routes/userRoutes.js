import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import UserPreference from '../models/UserPreference.js';
import Clothing from '../models/Clothing.js';
import ClothingCategory from '../models/ClothingCategory.js';
import Outfit from '../models/Outfit.js';
import { authenticate, generateToken } from '../middleware/auth.js';

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    // 检查手机号是否已存在（应用层验证）
    if (phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ message: '该手机号已被注册' });
      }
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建用户
    const user = await User.create({
      email,
      password_hash: hashedPassword,
      name,
      phone
    });

    // 创建用户偏好设置
    await UserPreference.create({
      userId: user.id
    });

    // 生成JWT令牌
    const token = generateToken(user);

    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '注册失败，请稍后重试' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 生成JWT令牌
    const token = generateToken(user);

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '登录失败，请稍后重试' });
  }
});

// 获取当前用户信息
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '获取用户信息失败，请稍后重试' });
  }
});

// 更新用户信息
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, gender, height, weight, avatar } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查手机号是否已被其他用户使用（应用层验证）
    if (phone && phone !== user.phone) {
      const { Op } = await import('sequelize');
      const existingPhone = await User.findOne({
        where: {
          phone,
          id: { [Op.ne]: req.user.id }
        }
      });
      if (existingPhone) {
        return res.status(400).json({ message: '该手机号已被其他用户使用' });
      }
    }

    // 更新用户信息
    await user.update({
      name,
      phone,
      gender,
      height,
      weight,
      avatar
    });

    res.json({
      message: '用户信息更新成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ message: '更新用户信息失败，请稍后重试' });
  }
});

// 获取用户偏好设置
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const preferences = await UserPreference.findOne({ where: { userId: req.user.id } });

    if (!preferences) {
      return res.status(404).json({ message: '用户偏好设置不存在' });
    }

    res.json(preferences);
  } catch (error) {
    console.error('获取用户偏好设置失败:', error);
    res.status(500).json({ message: '获取用户偏好设置失败，请稍后重试' });
  }
});

// 更新用户偏好设置
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { stylePreference, seasonPreference, brandPreference, colorPreference } = req.body;

    const preferences = await UserPreference.findOne({ where: { userId: req.user.id } });
    if (!preferences) {
      return res.status(404).json({ message: '用户偏好设置不存在' });
    }

    // 更新偏好设置
    await preferences.update({
      stylePreference,
      seasonPreference,
      brandPreference,
      colorPreference
    });

    res.json({
      message: '用户偏好设置更新成功',
      preferences
    });
  } catch (error) {
    console.error('更新用户偏好设置失败:', error);
    res.status(500).json({ message: '更新用户偏好设置失败，请稍后重试' });
  }
});

// 获取用户统计数据
router.get('/stats', authenticate, async (req, res) => {
  try {
    // 获取衣物数量
    const clothingCount = await Clothing.count({
      where: { userId: req.user.id }
    });

    // 获取穿搭数量
    const outfitCount = await Outfit.count({
      where: { userId: req.user.id }
    });

    // 获取用户使用的分类数量
    const categories = await Clothing.findAll({
      where: { userId: req.user.id },
      attributes: ['categoryId'],
      group: ['categoryId']
    });
    const categoryCount = categories.length;

    // 推荐数量（暂时使用模拟值，后续可以实现真实推荐逻辑）
    const recommendationCount = Math.min(clothingCount > 0 ? 3 : 0, 5);

    res.json({
      clothingCount,
      outfitCount,
      categoryCount,
      recommendationCount
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ message: '获取统计数据失败，请稍后重试' });
  }
});

export default router;