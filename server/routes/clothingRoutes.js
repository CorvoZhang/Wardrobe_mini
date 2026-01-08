import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import Clothing from '../models/Clothing.js';
import ClothingCategory from '../models/ClothingCategory.js';
import ClothingImage from '../models/ClothingImage.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    // 使用UUID生成唯一文件名
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage });

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
    
    // 创建图片记录
    const clothingImage = await ClothingImage.create({
      clothingId: clothing.id,
      imageUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
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

export default router;