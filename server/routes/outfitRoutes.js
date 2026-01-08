import express from 'express';
import Outfit from '../models/Outfit.js';
import OutfitClothing from '../models/OutfitClothing.js';
import Clothing from '../models/Clothing.js';
import ClothingImage from '../models/ClothingImage.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 获取穿搭列表
router.get('/', authenticate, async (req, res) => {
  try {
    const { occasion, season, page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { userId: req.user.id };
    
    if (occasion) {
      whereClause.occasion = occasion;
    }
    
    if (season) {
      whereClause.season = season;
    }
    
    const { count, rows: outfits } = await Outfit.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Clothing,
          as: 'clothing',
          through: {
            model: OutfitClothing,
            attributes: ['position', 'order']
          },
          attributes: ['id', 'name', 'categoryId']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      outfits
    });
  } catch (error) {
    console.error('获取穿搭列表失败:', error);
    res.status(500).json({ message: '获取穿搭列表失败，请稍后重试' });
  }
});

// 创建穿搭
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, occasion, season, clothingItems, clothingIds } = req.body;
    
    // 创建穿搭方案
    const outfit = await Outfit.create({
      userId: req.user.id,
      name,
      description,
      occasion,
      season
    });
    
    // 添加衣物到穿搭方案
    if (clothingIds && clothingIds.length > 0) {
      // 处理测试用例中的clothingIds参数
      const outfitClothingItems = clothingIds.map((clothingId, index) => ({
        outfitId: outfit.id,
        clothingId,
        position: 'main', // 默认位置
        order: index
      }));
      
      await OutfitClothing.bulkCreate(outfitClothingItems);
    } else if (clothingItems && clothingItems.length > 0) {
      // 处理clothingItems参数
      const outfitClothingItems = clothingItems.map((item, index) => ({
        outfitId: outfit.id,
        clothingId: item.clothingId,
        position: item.position,
        order: index
      }));
      
      await OutfitClothing.bulkCreate(outfitClothingItems);
    }
    
    // 获取完整的穿搭方案（包含衣物信息）
    const completeOutfit = await Outfit.findOne({
      where: { id: outfit.id },
      include: [
        {
          model: Clothing,
          as: 'clothing',
          through: {
            model: OutfitClothing,
            attributes: ['position', 'order']
          },
          attributes: ['id', 'name', 'categoryId']
        }
      ]
    });
    
    res.status(201).json({ message: '穿搭方案创建成功', outfit: completeOutfit });
  } catch (error) {
    console.error('创建穿搭方案失败:', error);
    res.status(500).json({ message: '创建穿搭方案失败，请稍后重试' });
  }
});

// 获取穿搭详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const outfit = await Outfit.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          model: Clothing,
          as: 'clothing',
          through: {
            model: OutfitClothing,
            attributes: ['position', 'order']
          },
          include: [
            {
              model: ClothingImage,
              as: 'images',
              attributes: ['id', 'imageUrl', 'imageType', 'order']
            }
          ]
        }
      ]
    });
    
    if (!outfit) {
      return res.status(404).json({ message: '穿搭方案不存在' });
    }
    
    res.json(outfit);
  } catch (error) {
    console.error('获取穿搭详情失败:', error);
    res.status(500).json({ message: '获取穿搭详情失败，请稍后重试' });
  }
});

// 更新穿搭
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, occasion, season } = req.body;
    
    const outfit = await Outfit.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!outfit) {
      return res.status(404).json({ message: '穿搭方案不存在' });
    }
    
    await outfit.update({
      name,
      description,
      occasion,
      season
    });
    
    res.json({ message: '穿搭方案更新成功', outfit });
  } catch (error) {
    console.error('更新穿搭方案失败:', error);
    res.status(500).json({ message: '更新穿搭方案失败，请稍后重试' });
  }
});

// 删除穿搭
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const outfit = await Outfit.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!outfit) {
      return res.status(404).json({ message: '穿搭方案不存在' });
    }
    
    // 删除穿搭方案及其关联的衣物关系
    await OutfitClothing.destroy({ where: { outfitId: outfit.id } });
    await outfit.destroy();
    
    res.json({ message: '穿搭方案删除成功' });
  } catch (error) {
    console.error('删除穿搭方案失败:', error);
    res.status(500).json({ message: '删除穿搭方案失败，请稍后重试' });
  }
});

// 添加衣物到穿搭
router.post('/:id/clothing', authenticate, async (req, res) => {
  try {
    const { clothingId, position } = req.body;
    
    // 验证穿搭方案是否存在且属于当前用户
    const outfit = await Outfit.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!outfit) {
      return res.status(404).json({ message: '穿搭方案不存在' });
    }
    
    // 验证衣物是否存在且属于当前用户
    const clothing = await Clothing.findOne({
      where: {
        id: clothingId,
        userId: req.user.id
      }
    });
    
    if (!clothing) {
      return res.status(404).json({ message: '衣物不存在' });
    }
    
    // 获取当前最大排序值
    const maxOrder = await OutfitClothing.max('order', { where: { outfitId: outfit.id } });
    const order = maxOrder ? maxOrder + 1 : 0;
    
    // 添加衣物到穿搭方案
    const outfitClothing = await OutfitClothing.create({
      outfitId: outfit.id,
      clothingId,
      position,
      order
    });
    
    res.status(201).json({ 
      message: '衣物添加到穿搭方案成功',
      outfitClothing 
    });
  } catch (error) {
    console.error('添加衣物到穿搭失败:', error);
    res.status(500).json({ message: '添加衣物到穿搭失败，请稍后重试' });
  }
});

// 从穿搭中移除衣物
router.delete('/:id/clothing/:clothingId', authenticate, async (req, res) => {
  try {
    // 验证穿搭方案是否存在且属于当前用户
    const outfit = await Outfit.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!outfit) {
      return res.status(404).json({ message: '穿搭方案不存在' });
    }
    
    // 移除衣物
    const result = await OutfitClothing.destroy({
      where: {
        outfitId: req.params.id,
        clothingId: req.params.clothingId
      }
    });
    
    if (result === 0) {
      return res.status(404).json({ message: '衣物不在该穿搭方案中' });
    }
    
    res.json({ message: '衣物从穿搭中移除成功' });
  } catch (error) {
    console.error('从穿搭中移除衣物失败:', error);
    res.status(500).json({ message: '从穿搭中移除衣物失败，请稍后重试' });
  }
});

export default router;