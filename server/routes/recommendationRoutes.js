import express from 'express';
import { Op } from 'sequelize';
import Clothing from '../models/Clothing.js';
import ClothingImage from '../models/ClothingImage.js';
import Outfit from '../models/Outfit.js';
import OutfitClothing from '../models/OutfitClothing.js';
import { authenticate } from '../middleware/auth.js';
import { parseNaturalLanguage } from '../services/aiService.js';

const router = express.Router();

// 获取衣物推荐
router.get('/clothing', authenticate, async (req, res) => {
  try {
    const { categoryId, occasion, season, limit = 10 } = req.query;
    
    // 基于规则的推荐逻辑：简单地根据分类、场合或季节筛选
    const whereClause = { userId: req.user.id };
    
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    // 这里可以添加更复杂的推荐逻辑，例如基于用户历史搭配、偏好等
    const recommendedClothing = await Clothing.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json({
      message: '获取衣物推荐成功',
      clothing: recommendedClothing
    });
  } catch (error) {
    console.error('获取衣物推荐失败:', error);
    res.status(500).json({ message: '获取衣物推荐失败，请稍后重试' });
  }
});

// 获取搭配推荐
router.get('/outfits', authenticate, async (req, res) => {
  try {
    const { occasion, season, limit = 5 } = req.query;
    
    // 基于规则的推荐逻辑：简单地根据场合或季节筛选用户的历史搭配
    const whereClause = { userId: req.user.id };
    
    if (occasion) {
      whereClause.occasion = occasion;
    }
    
    if (season) {
      whereClause.season = season;
    }
    
    const recommendedOutfits = await Outfit.findAll({
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
      limit: parseInt(limit)
    });
    
    res.json({
      message: '获取搭配推荐成功',
      outfits: recommendedOutfits
    });
  } catch (error) {
    console.error('获取搭配推荐失败:', error);
    res.status(500).json({ message: '获取搭配推荐失败，请稍后重试' });
  }
});

// 基于现有衣物生成搭配建议
router.post('/complete-outfit', authenticate, async (req, res) => {
  try {
    const { clothingId } = req.body;
    
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
    
    // 简单的搭配建议逻辑：推荐不同分类的衣物
    // 例如，如果当前衣物是上衣，推荐裤子、鞋子等
    const recommendedClothing = await Clothing.findAll({
      where: {
        userId: req.user.id,
        categoryId: { [Op.ne]: clothing.categoryId } // 排除相同分类
      },
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    res.json({
      message: '生成搭配建议成功',
      recommendedClothing
    });
  } catch (error) {
    console.error('生成搭配建议失败:', error);
    res.status(500).json({ message: '生成搭配建议失败，请稍后重试' });
  }
});

// 基于自然语言描述获取推荐（简单版本 - 保留向后兼容）
router.post('/natural-language', authenticate, async (req, res) => {
  try {
    const { description, type = 'outfit' } = req.body;
    
    if (!description) {
      return res.status(400).json({ message: '请提供描述信息' });
    }
    
    // 简单的关键词解析逻辑
    const keywords = {
      seasons: ['春季', '夏季', '秋季', '冬季', '春', '夏', '秋', '冬'],
      occasions: ['日常', '职场', '约会', '聚会', '运动', '正式', '休闲'],
      styles: ['休闲', '正式', '运动', '甜美', '简约', '时尚']
    };
    
    // 从描述中提取关键词
    let detectedSeason = null;
    let detectedOccasion = null;
    let detectedStyle = null;
    
    for (const season of keywords.seasons) {
      if (description.includes(season)) {
        detectedSeason = season.length === 1 ? season + '季' : season;
        break;
      }
    }
    
    for (const occasion of keywords.occasions) {
      if (description.includes(occasion)) {
        detectedOccasion = occasion;
        break;
      }
    }
    
    for (const style of keywords.styles) {
      if (description.includes(style)) {
        detectedStyle = style;
        break;
      }
    }
    
    let recommendations = [];
    
    if (type === 'outfit') {
      // 获取穿搭推荐
      const whereClause = { userId: req.user.id };
      if (detectedSeason) whereClause.season = detectedSeason;
      if (detectedOccasion) whereClause.occasion = detectedOccasion;
      
      recommendations = await Outfit.findAll({
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
        limit: 5
      });
    } else {
      // 获取衣物推荐
      const whereClause = { userId: req.user.id };
      if (detectedStyle) whereClause.style = detectedStyle;
      if (detectedSeason) whereClause.season = detectedSeason;
      
      recommendations = await Clothing.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: 10
      });
    }
    
    res.json({
      message: '自然语言推荐获取成功',
      recommendations,
      parsedKeywords: {
        season: detectedSeason,
        occasion: detectedOccasion,
        style: detectedStyle
      }
    });
  } catch (error) {
    console.error('自然语言推荐失败:', error);
    res.status(500).json({ message: '自然语言推荐失败，请稍后重试' });
  }
});

// AI 智能自然语言解析与推荐
router.post('/nlp', authenticate, async (req, res) => {
  try {
    const { description, type = 'clothing', limit = 10 } = req.body;
    
    if (!description || description.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: '请提供描述信息' 
      });
    }
    
    // 调用 AI 服务解析自然语言
    const nlpResult = await parseNaturalLanguage(description);
    
    if (!nlpResult.success) {
      return res.status(500).json({
        success: false,
        message: nlpResult.message || '自然语言解析失败'
      });
    }
    
    const { parsedResult, suggestions, confidence, isMock } = nlpResult;
    
    let recommendations = [];
    
    if (type === 'outfit') {
      // 获取穿搭推荐
      const whereClause = { userId: req.user.id };
      
      if (parsedResult.season) {
        whereClause.season = { [Op.like]: `%${parsedResult.season}%` };
      }
      if (parsedResult.occasion) {
        whereClause.occasion = { [Op.like]: `%${parsedResult.occasion}%` };
      }
      
      recommendations = await Outfit.findAll({
        where: whereClause,
        include: [
          {
            model: Clothing,
            as: 'clothing',
            through: { 
              model: OutfitClothing,
              attributes: ['position', 'order'] 
            },
            attributes: ['id', 'name', 'categoryId'],
            include: [{
              model: ClothingImage,
              as: 'images',
              attributes: ['id', 'imageUrl', 'imageType']
            }]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });
      
    } else {
      // 获取衣物推荐
      const whereClause = { userId: req.user.id };
      
      // 构建模糊匹配条件
      const orConditions = [];
      
      if (parsedResult.style) {
        orConditions.push({ style: { [Op.like]: `%${parsedResult.style}%` } });
      }
      if (parsedResult.season) {
        orConditions.push({ season: { [Op.like]: `%${parsedResult.season}%` } });
      }
      if (parsedResult.color) {
        orConditions.push({ color: { [Op.like]: `%${parsedResult.color}%` } });
      }
      if (parsedResult.category) {
        orConditions.push({ name: { [Op.like]: `%${parsedResult.category}%` } });
      }
      
      // 如果有匹配条件，使用 OR 查询
      if (orConditions.length > 0) {
        whereClause[Op.or] = orConditions;
      }
      
      recommendations = await Clothing.findAll({
        where: whereClause,
        include: [{
          model: ClothingImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'imageType']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });
      
      // 如果匹配结果太少，补充一些最新的衣物
      if (recommendations.length < 3) {
        const existingIds = recommendations.map(r => r.id);
        const additionalItems = await Clothing.findAll({
          where: {
            userId: req.user.id,
            id: { [Op.notIn]: existingIds }
          },
          include: [{
            model: ClothingImage,
            as: 'images',
            attributes: ['id', 'imageUrl', 'imageType']
          }],
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit) - recommendations.length
        });
        recommendations = [...recommendations, ...additionalItems];
      }
    }
    
    res.json({
      success: true,
      message: isMock ? 'AI 智能推荐完成（Mock 模式）' : 'AI 智能推荐完成',
      data: {
        recommendations,
        parsedResult,
        suggestions,
        confidence,
        isMock,
        originalDescription: description
      }
    });
    
  } catch (error) {
    console.error('AI 智能推荐失败:', error);
    res.status(500).json({ 
      success: false,
      message: 'AI 智能推荐失败，请稍后重试' 
    });
  }
});

// 获取与特定衣物搭配的推荐
router.get('/clothing/:id/match', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;
    
    // 验证衣物是否存在且属于当前用户
    const clothing = await Clothing.findOne({
      where: {
        id: id,
        userId: req.user.id
      }
    });
    
    if (!clothing) {
      return res.status(404).json({ message: '衣物不存在' });
    }
    
    // 简单的搭配推荐逻辑：推荐不同分类但风格相似的衣物
    const whereClause = {
      userId: req.user.id,
      id: { [Op.ne]: id }, // 排除当前衣物
      categoryId: { [Op.ne]: clothing.categoryId } // 排除相同分类
    };
    
    // 如果有风格信息，优先推荐相同风格的衣物
    if (clothing.style) {
      whereClause.style = clothing.style;
    }
    
    let recommendations = await Clothing.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    // 如果相同风格的推荐数量不足，补充其他分类的衣物
    if (recommendations.length < parseInt(limit)) {
      const remainingLimit = parseInt(limit) - recommendations.length;
      const existingIds = recommendations.map(r => r.id);
      existingIds.push(id);
      
      const additionalRecommendations = await Clothing.findAll({
        where: {
          userId: req.user.id,
          id: { [Op.notIn]: existingIds },
          categoryId: { [Op.ne]: clothing.categoryId }
        },
        order: [['createdAt', 'DESC']],
        limit: remainingLimit
      });
      
      recommendations = [...recommendations, ...additionalRecommendations];
    }
    
    res.json({
      message: '获取搭配推荐成功',
      recommendations,
      baseClothing: {
        id: clothing.id,
        name: clothing.name,
        categoryId: clothing.categoryId,
        style: clothing.style
      }
    });
  } catch (error) {
    console.error('获取搭配推荐失败:', error);
    res.status(500).json({ message: '获取搭配推荐失败，请稍后重试' });
  }
});

export default router;