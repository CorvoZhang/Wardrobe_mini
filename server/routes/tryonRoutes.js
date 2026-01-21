import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { generateTryOnImage, getAIServiceStatus, PRESET_MODELS, PRESET_SCENES } from '../services/aiService.js';
import { uploadFromUrl, isStorageAvailable, BUCKETS, getStorageStatus } from '../services/storageService.js';
import TryOnHistory from '../models/TryOnHistory.js';
import Clothing from '../models/Clothing.js';
import ClothingImage from '../models/ClothingImage.js';

const router = express.Router();

/**
 * GET /api/tryon/status
 * 获取 AI 服务和存储服务状态
 */
router.get('/status', (req, res) => {
  const aiStatus = getAIServiceStatus();
  const storageStatus = getStorageStatus();
  
  res.json({
    ...aiStatus,
    storage: storageStatus
  });
});

/**
 * GET /api/tryon/models
 * 获取预设模特列表
 */
router.get('/models', (req, res) => {
  res.json({
    success: true,
    models: PRESET_MODELS
  });
});

/**
 * GET /api/tryon/scenes
 * 获取预设场景列表
 */
router.get('/scenes', (req, res) => {
  const { category } = req.query;
  
  let scenes = PRESET_SCENES;
  
  // 如果指定了分类，过滤场景
  if (category) {
    scenes = PRESET_SCENES.filter(s => s.category === category);
  }
  
  // 按分类分组
  const groupedScenes = {
    outdoor: scenes.filter(s => s.category === 'outdoor'),
    indoor: scenes.filter(s => s.category === 'indoor'),
    formal: scenes.filter(s => s.category === 'formal'),
    casual: scenes.filter(s => s.category === 'casual'),
    seasonal: scenes.filter(s => s.category === 'seasonal'),
    special: scenes.filter(s => s.category === 'special')
  };
  
  // 分类名称映射
  const categoryNames = {
    outdoor: '户外场景',
    indoor: '室内场景',
    formal: '正式场合',
    casual: '休闲场合',
    seasonal: '季节场景',
    special: '特殊场合'
  };
  
  res.json({
    success: true,
    total: scenes.length,
    scenes: category ? scenes : PRESET_SCENES,
    groupedScenes,
    categoryNames
  });
});

/**
 * GET /api/tryon/scenes/:id
 * 获取单个场景详情
 */
router.get('/scenes/:id', (req, res) => {
  const scene = PRESET_SCENES.find(s => s.id === req.params.id);
  
  if (!scene) {
    return res.status(404).json({
      success: false,
      message: '场景不存在'
    });
  }
  
  res.json({
    success: true,
    scene
  });
});

/**
 * POST /api/tryon/generate
 * 生成虚拟试穿图片
 * Body: { clothingId, modelImageUrl?, presetModelId?, category?, sceneId? }
 */
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { clothingId, modelImageUrl, presetModelId, category = 'upper_body', sceneId } = req.body;
    const userId = req.user.id;

    // 验证必要参数
    if (!clothingId) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供衣物 ID' 
      });
    }

    // 获取模特图片 URL
    let finalModelImageUrl = modelImageUrl;
    let modelType = 'upload';

    if (presetModelId) {
      const presetModel = PRESET_MODELS.find(m => m.id === presetModelId);
      if (!presetModel) {
        return res.status(400).json({ 
          success: false, 
          message: '无效的预设模特 ID' 
        });
      }
      finalModelImageUrl = presetModel.imageUrl;
      modelType = 'preset';
    }

    if (!finalModelImageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供模特图片或选择预设模特' 
      });
    }

    // 获取场景信息（可选）
    let scene = null;
    if (sceneId) {
      scene = PRESET_SCENES.find(s => s.id === sceneId);
      if (!scene) {
        return res.status(400).json({ 
          success: false, 
          message: '无效的场景 ID' 
        });
      }
    }

    // 获取衣物信息
    const clothing = await Clothing.findOne({
      where: { id: clothingId, userId },
      include: [{
        model: ClothingImage,
        as: 'images'
      }]
    });

    if (!clothing) {
      return res.status(404).json({ 
        success: false, 
        message: '未找到该衣物或无权访问' 
      });
    }

    // 获取衣物图片 URL
    const clothingImageUrl = clothing.images?.[0]?.imageUrl;
    if (!clothingImageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: '该衣物没有图片，无法进行虚拟试穿' 
      });
    }

    // 调用 AI 服务生成试穿图片，传递衣物详细信息和场景
    const result = await generateTryOnImage({
      clothingImageUrl,
      modelImageUrl: finalModelImageUrl,
      category,
      clothingInfo: {
        name: clothing.name,
        color: clothing.color,
        style: clothing.style,
        brand: clothing.brand
      },
      scene
    });

    if (!result.success) {
      // 记录失败的尝试
      await TryOnHistory.create({
        userId,
        clothingId,
        modelImageUrl: finalModelImageUrl,
        modelType,
        presetModelId: presetModelId || null,
        clothingImageUrl,
        generatedImageUrl: '',
        category,
        sceneId: sceneId || null,
        isMock: false,
        status: 'failed',
        errorMessage: result.error
      });

      return res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }

    // 如果不是 Mock 模式且 Supabase Storage 可用，将生成的图片上传到云存储
    let finalImageUrl = result.imageUrl;
    
    if (!result.isMock && isStorageAvailable()) {
      try {
        console.log('📤 正在将试穿结果图上传到 Supabase Storage...');
        const uploadResult = await uploadFromUrl(
          result.imageUrl,
          BUCKETS.TRYON,
          'tryon'
        );
        
        if (uploadResult.success) {
          finalImageUrl = uploadResult.publicUrl;
          console.log('✅ 试穿结果图已上传到云存储:', finalImageUrl);
        } else {
          console.log('⚠️ 云存储上传失败，使用原始 URL');
        }
      } catch (uploadError) {
        console.error('上传试穿结果图失败:', uploadError);
        // 继续使用原始 URL
      }
    }

    // 保存成功的生成记录
    const history = await TryOnHistory.create({
      userId,
      clothingId,
      modelImageUrl: finalModelImageUrl,
      modelType,
      presetModelId: presetModelId || null,
      clothingImageUrl,
      generatedImageUrl: finalImageUrl,
      category,
      sceneId: sceneId || null,
      isMock: result.isMock,
      status: 'completed'
    });

    res.json({
      success: true,
      message: result.message,
      data: {
        id: history.id,
        generatedImageUrl: finalImageUrl,
        isMock: result.isMock,
        clothing: {
          id: clothing.id,
          name: clothing.name,
          imageUrl: clothingImageUrl
        },
        modelImageUrl: finalModelImageUrl,
        scene: scene ? { id: scene.id, name: scene.name, category: scene.category } : null,
        createdAt: history.createdAt
      }
    });

  } catch (error) {
    console.error('虚拟试穿生成失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
});

/**
 * GET /api/tryon/history
 * 获取用户的试穿历史记录
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await TryOnHistory.findAndCountAll({
      where: { userId, status: 'completed' },
      include: [{
        model: Clothing,
        as: 'clothing',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('获取试穿历史失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取历史记录失败',
      error: error.message 
    });
  }
});

/**
 * GET /api/tryon/history/:id
 * 获取单条试穿记录详情
 */
router.get('/history/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const record = await TryOnHistory.findOne({
      where: { id, userId },
      include: [{
        model: Clothing,
        as: 'clothing',
        attributes: ['id', 'name'],
        include: [{
          model: ClothingImage,
          as: 'images'
        }]
      }]
    });

    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: '未找到该试穿记录' 
      });
    }

    res.json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error('获取试穿记录详情失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取记录详情失败',
      error: error.message 
    });
  }
});

/**
 * DELETE /api/tryon/history/:id
 * 删除试穿记录
 */
router.delete('/history/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const record = await TryOnHistory.findOne({
      where: { id, userId }
    });

    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: '未找到该试穿记录' 
      });
    }

    await record.destroy();

    res.json({
      success: true,
      message: '试穿记录已删除'
    });

  } catch (error) {
    console.error('删除试穿记录失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '删除记录失败',
      error: error.message 
    });
  }
});

export default router;
