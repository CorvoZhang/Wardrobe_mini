import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import Clothing from '../models/Clothing.js';
import ClothingCategory from '../models/ClothingCategory.js';
import ClothingImage from '../models/ClothingImage.js';
import { authenticate } from '../middleware/auth.js';
import { removeBackground, recognizeClothingAttributes } from '../services/aiService.js';
import { uploadImage, uploadFromUrl, isStorageAvailable, BUCKETS } from '../services/storageService.js';

const router = express.Router();

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 支持的图片格式
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'image/avif'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.svg', '.heic', '.heif', '.avif'];

// 配置 multer 用于文件上传
// 使用内存存储，然后上传到 Supabase Storage（如果可用）或本地文件系统
const storage = isStorageAvailable() 
  ? multer.memoryStorage()  // Supabase 模式：使用内存存储
  : multer.diskStorage({     // 本地模式：使用磁盘存储
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
      },
      filename: function (req, file, cb) {
        const uniqueFilename = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueFilename);
      }
    });

// 文件类型过滤器
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  const isValidExt = ALLOWED_EXTENSIONS.includes(ext);
  
  if (isValidMime || isValidExt) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的图片格式。支持的格式：JPG, PNG, GIF, WebP, BMP, TIFF, SVG, HEIC, HEIF, AVIF`), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 获取衣物分类列表
router.get('/categories', async (req, res) => {
  try {
    const categories = await ClothingCategory.findAll({
      order: [['order', 'ASC']]
    });
    res.json(categories);
  } catch (error) {
    console.error('获取衣物分类失败:', error);
    res.status(500).json({ message: '获取衣物分类失败，请稍后重试' });
  }
});

// 创建衣物分类
router.post('/categories', authenticate, async (req, res) => {
  try {
    const { name, parentId, order } = req.body;
    const category = await ClothingCategory.create({
      name,
      parentId,
      order
    });
    res.status(201).json({ message: '衣物分类创建成功', category });
  } catch (error) {
    console.error('创建衣物分类失败:', error);
    res.status(500).json({ message: '创建衣物分类失败，请稍后重试' });
  }
});

// 获取衣物列表
router.get('/', authenticate, async (req, res) => {
  try {
    const { categoryId, search, page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { userId: req.user.id };
    
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }
    
    const { count, rows: clothing } = await Clothing.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ClothingCategory,
          as: 'category'
        },
        {
          model: ClothingImage,
          as: 'images'
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
      clothing
    });
  } catch (error) {
    console.error('获取衣物列表失败:', error);
    res.status(500).json({ message: '获取衣物列表失败，请稍后重试' });
  }
});

// 创建衣物
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, categoryId } = req.body;
    
    const clothing = await Clothing.create({
      userId: req.user.id,
      name,
      categoryId
    });
    
    res.status(201).json({ message: '衣物创建成功', clothing });
  } catch (error) {
    console.error('创建衣物失败:', error);
    res.status(500).json({ message: '创建衣物失败，请稍后重试' });
  }
});

// 获取衣物详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const clothing = await Clothing.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          model: ClothingCategory,
          as: 'category'
        },
        {
          model: ClothingImage,
          as: 'images',
          order: [['order', 'ASC']]
        }
      ]
    });
    
    if (!clothing) {
      return res.status(404).json({ message: '衣物不存在' });
    }
    
    res.json(clothing);
  } catch (error) {
    console.error('获取衣物详情失败:', error);
    res.status(500).json({ message: '获取衣物详情失败，请稍后重试' });
  }
});

// 更新衣物
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, categoryId } = req.body;
    
    const clothing = await Clothing.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!clothing) {
      return res.status(404).json({ message: '衣物不存在' });
    }
    
    await clothing.update({
      name,
      categoryId
    });
    
    res.json({ message: '衣物更新成功', clothing });
  } catch (error) {
    console.error('更新衣物失败:', error);
    res.status(500).json({ message: '更新衣物失败，请稍后重试' });
  }
});

// 删除衣物
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const clothing = await Clothing.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!clothing) {
      return res.status(404).json({ message: '衣物不存在' });
    }
    
    // 删除关联的图片
    await ClothingImage.destroy({ where: { clothingId: clothing.id } });
    
    // 删除衣物
    await clothing.destroy();
    
    res.json({ message: '衣物删除成功' });
  } catch (error) {
    console.error('删除衣物失败:', error);
    res.status(500).json({ message: '删除衣物失败，请稍后重试' });
  }
});

// 上传衣物图片
router.post('/:id/images', authenticate, upload.single('image'), async (req, res) => {
  try {
    const clothing = await Clothing.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!clothing) {
      return res.status(404).json({ message: '衣物不存在' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: '未选择要上传的图片' });
    }
    
    // 获取当前最大排序值
    const maxOrder = await ClothingImage.max('order', { where: { clothingId: clothing.id } });
    const order = maxOrder ? maxOrder + 1 : 0;
    
    let imageUrl;
    
    // 判断使用 Supabase Storage 还是本地存储
    if (isStorageAvailable() && req.file.buffer) {
      // Supabase Storage 模式
      const uploadResult = await uploadImage(
        req.file.buffer,
        BUCKETS.CLOTHING,
        req.file.originalname,
        req.file.mimetype
      );
      
      if (!uploadResult.success) {
        return res.status(500).json({ 
          message: uploadResult.message || '图片上传到云存储失败' 
        });
      }
      
      imageUrl = uploadResult.publicUrl;
      console.log('✅ 图片已上传到 Supabase Storage:', imageUrl);
    } else {
      // 本地存储模式
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      console.log('📁 图片已保存到本地:', imageUrl);
    }
    
    // 创建图片记录
    const clothingImage = await ClothingImage.create({
      clothingId: clothing.id,
      imageUrl,
      imageType: 'original',
      order
    });
    
    res.status(201).json({ message: '图片上传成功', image: clothingImage });
  } catch (error) {
    console.error('上传衣物图片失败:', error);
    res.status(500).json({ message: '上传衣物图片失败，请稍后重试' });
  }
});

// 删除衣物图片
router.delete('/images/:imageId', authenticate, async (req, res) => {
  try {
    const image = await ClothingImage.findOne({
      include: [
        {
          model: Clothing,
          where: { userId: req.user.id }
        }
      ],
      where: { id: req.params.imageId }
    });
    
    if (!image) {
      return res.status(404).json({ message: '图片不存在' });
    }
    
    await image.destroy();
    
    res.json({ message: '图片删除成功' });
  } catch (error) {
    console.error('删除衣物图片失败:', error);
    res.status(500).json({ message: '删除衣物图片失败，请稍后重试' });
  }
});

// AI 图像处理 - 去除背景
router.post('/:id/process-image', authenticate, async (req, res) => {
  try {
    const { imageId } = req.body;
    
    // 验证衣物所有权
    const clothing = await Clothing.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!clothing) {
      return res.status(404).json({ message: '衣物不存在' });
    }
    
    // 获取要处理的图片
    const image = await ClothingImage.findOne({
      where: {
        id: imageId,
        clothingId: clothing.id
      }
    });
    
    if (!image) {
      return res.status(404).json({ message: '图片不存在' });
    }
    
    // 调用 AI 服务去除背景
    const result = await removeBackground(image.imageUrl);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false,
        message: result.message || '图片处理失败'
      });
    }
    
    // 如果是真实处理（非 Mock），创建处理后的图片记录
    if (!result.isMock) {
      const processedImageUrl = result.processedImageUrl;
      
      try {
        let finalImageUrl;
        
        // 判断使用 Supabase Storage 还是本地存储
        if (isStorageAvailable()) {
          // Supabase Storage 模式：下载并上传到云存储
          const uploadResult = await uploadFromUrl(
            processedImageUrl,
            BUCKETS.CLOTHING,
            'processed'
          );
          
          if (uploadResult.success) {
            finalImageUrl = uploadResult.publicUrl;
            console.log('✅ 处理后图片已上传到 Supabase Storage:', finalImageUrl);
          } else {
            // 上传失败，使用远程 URL
            finalImageUrl = processedImageUrl;
            console.log('⚠️ 云存储上传失败，使用远程 URL');
          }
        } else {
          // 本地存储模式：下载并保存到本地
          const processedFilename = `processed-${uuidv4()}.png`;
          const processedPath = path.join(__dirname, '../uploads', processedFilename);
          
          const response = await fetch(processedImageUrl);
          const buffer = Buffer.from(await response.arrayBuffer());
          fs.writeFileSync(processedPath, buffer);
          
          finalImageUrl = `${req.protocol}://${req.get('host')}/uploads/${processedFilename}`;
          console.log('📁 处理后图片已保存到本地:', finalImageUrl);
        }
        
        // 获取当前最大排序值
        const maxOrder = await ClothingImage.max('order', { where: { clothingId: clothing.id } });
        const order = maxOrder ? maxOrder + 1 : 0;
        
        // 创建处理后图片的记录
        const processedImage = await ClothingImage.create({
          clothingId: clothing.id,
          imageUrl: finalImageUrl,
          imageType: 'processed',
          order
        });
        
        return res.json({
          success: true,
          message: '背景去除成功',
          data: {
            originalImage: image,
            processedImage: processedImage,
            isMock: false
          }
        });
      } catch (downloadError) {
        console.error('下载处理后图片失败:', downloadError);
        // 即使下载失败，也返回远程 URL
        return res.json({
          success: true,
          message: '背景去除成功（远程URL）',
          data: {
            originalImage: image,
            processedImageUrl: processedImageUrl,
            isMock: false
          }
        });
      }
    }
    
    // Mock 模式返回
    res.json({
      success: true,
      message: result.message,
      data: {
        originalImage: image,
        processedImageUrl: result.processedImageUrl,
        isMock: true
      }
    });
    
  } catch (error) {
    console.error('处理衣物图片失败:', error);
    res.status(500).json({ 
      success: false,
      message: '处理衣物图片失败，请稍后重试' 
    });
  }
});

// AI 衣物属性自动识别
router.post('/:id/recognize-attributes', authenticate, async (req, res) => {
  try {
    const { imageId } = req.body;
    
    // 验证衣物所有权
    const clothing = await Clothing.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!clothing) {
      return res.status(404).json({ message: '衣物不存在' });
    }
    
    // 获取要分析的图片
    let imageUrl;
    if (imageId) {
      const image = await ClothingImage.findOne({
        where: {
          id: imageId,
          clothingId: clothing.id
        }
      });
      if (!image) {
        return res.status(404).json({ message: '图片不存在' });
      }
      imageUrl = image.imageUrl;
    } else {
      // 使用第一张图片
      const firstImage = await ClothingImage.findOne({
        where: { clothingId: clothing.id },
        order: [['order', 'ASC']]
      });
      if (!firstImage) {
        return res.status(400).json({ message: '该衣物没有图片' });
      }
      imageUrl = firstImage.imageUrl;
    }
    
    // 调用 AI 服务识别属性
    const result = await recognizeClothingAttributes(imageUrl);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false,
        message: result.message || '属性识别失败'
      });
    }
    
    // 更新衣物属性
    if (result.attributes) {
      await clothing.update({
        color: result.attributes.color,
        style: result.attributes.style,
        season: result.attributes.season
      });
    }
    
    res.json({
      success: true,
      message: result.isMock ? 'Mock 模式识别完成' : '属性识别成功',
      data: {
        attributes: result.attributes,
        isMock: result.isMock
      }
    });
    
  } catch (error) {
    console.error('识别衣物属性失败:', error);
    res.status(500).json({ 
      success: false,
      message: '识别衣物属性失败，请稍后重试' 
    });
  }
});

export default router;