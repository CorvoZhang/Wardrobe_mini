# Multer 文件上传配置

## 概述

Multer 是 Node.js 中处理 `multipart/form-data` 的中间件，主要用于文件上传。本文档总结了在 Express 应用中实现安全、可靠的文件上传功能的最佳实践。

## 适用场景

- 用户头像上传
- 图片/文档上传
- 批量文件上传
- 带文件的表单提交

## 安装依赖

```bash
npm install multer uuid
```

## 核心实现

### 1. 基础配置

```javascript
// routes/uploadRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ES Module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== 存储配置 ====================
const storage = multer.diskStorage({
  // 指定文件保存目录
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  // 自定义文件名
  filename: function (req, file, cb) {
    // 使用 UUID 生成唯一文件名，保留原始扩展名
    const ext = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${ext}`;
    cb(null, uniqueFilename);
  }
});

// ==================== 文件类型验证 ====================
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/heic',
  'image/heif',
  'image/avif'
];

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', 
  '.webp', '.bmp', '.heic', '.heif', '.avif'
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  const isValidExt = ALLOWED_EXTENSIONS.includes(ext);
  
  if (isValidMime || isValidExt) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件格式。支持的格式：${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }
};

// ==================== 创建 Multer 实例 ====================
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10MB 限制
    files: 5                      // 最多 5 个文件
  }
});

export default upload;
```

### 2. 单文件上传路由

```javascript
// routes/clothingRoutes.js
import express from 'express';
import upload from '../config/upload.js';
import { authenticate } from '../middleware/auth.js';
import Clothing from '../models/Clothing.js';
import ClothingImage from '../models/ClothingImage.js';

const router = express.Router();

/**
 * 上传单个衣物图片
 * POST /api/clothing/:id/images
 */
router.post('/:id/images', authenticate, upload.single('image'), async (req, res) => {
  try {
    // 1. 验证衣物所有权
    const clothing = await Clothing.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!clothing) {
      return res.status(404).json({ message: '衣物不存在' });
    }
    
    // 2. 检查是否上传了文件
    if (!req.file) {
      return res.status(400).json({ message: '未选择要上传的图片' });
    }
    
    // 3. 构建图片 URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    // 4. 获取当前最大排序值
    const maxOrder = await ClothingImage.max('order', { 
      where: { clothingId: clothing.id } 
    });
    const order = maxOrder ? maxOrder + 1 : 0;
    
    // 5. 创建图片记录
    const clothingImage = await ClothingImage.create({
      clothingId: clothing.id,
      imageUrl,
      imageType: 'original',
      order
    });
    
    res.status(201).json({ 
      message: '图片上传成功', 
      image: clothingImage 
    });
    
  } catch (error) {
    console.error('上传衣物图片失败:', error);
    res.status(500).json({ message: '上传衣物图片失败，请稍后重试' });
  }
});

export default router;
```

### 3. 多文件上传

```javascript
/**
 * 批量上传图片
 * POST /api/clothing/:id/images/batch
 */
router.post('/:id/images/batch', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const clothing = await Clothing.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!clothing) {
      return res.status(404).json({ message: '衣物不存在' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '未选择要上传的图片' });
    }
    
    // 获取当前最大排序值
    let maxOrder = await ClothingImage.max('order', { 
      where: { clothingId: clothing.id } 
    }) || 0;
    
    // 批量创建图片记录
    const images = await Promise.all(req.files.map(async (file, index) => {
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      return ClothingImage.create({
        clothingId: clothing.id,
        imageUrl,
        imageType: 'original',
        order: maxOrder + index + 1
      });
    }));
    
    res.status(201).json({ 
      message: `成功上传 ${images.length} 张图片`, 
      images 
    });
    
  } catch (error) {
    console.error('批量上传图片失败:', error);
    res.status(500).json({ message: '批量上传图片失败' });
  }
});
```

### 4. 多字段上传

```javascript
/**
 * 上传多种类型的文件
 * POST /api/products
 */
const productUpload = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'thumbnails', maxCount: 5 },
  { name: 'documents', maxCount: 3 }
]);

router.post('/products', authenticate, productUpload, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // 访问不同字段的文件
    const mainImage = req.files['mainImage']?.[0];
    const thumbnails = req.files['thumbnails'] || [];
    const documents = req.files['documents'] || [];
    
    // 处理文件...
    
    res.status(201).json({ 
      message: '产品创建成功',
      mainImage: mainImage?.filename,
      thumbnailCount: thumbnails.length,
      documentCount: documents.length
    });
    
  } catch (error) {
    res.status(500).json({ message: '创建失败' });
  }
});
```

## 高级配置

### 1. 内存存储（适用于小文件或需要直接处理）

```javascript
const memoryStorage = multer.memoryStorage();

const memoryUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }  // 5MB
});

router.post('/avatar', memoryUpload.single('avatar'), async (req, res) => {
  // req.file.buffer 包含文件的完整数据
  const imageBuffer = req.file.buffer;
  
  // 可以直接处理或上传到云存储
  const result = await uploadToS3(imageBuffer, req.file.originalname);
  
  res.json({ url: result.url });
});
```

### 2. 云存储集成（S3/阿里云 OSS）

```javascript
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const s3Upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `uploads/${Date.now()}-${uuidv4()}${ext}`;
      cb(null, filename);
    }
  }),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
```

### 3. 动态目录

```javascript
const dynamicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 根据用户 ID 创建子目录
    const userDir = path.join(__dirname, '../uploads', req.user.id);
    
    // 确保目录存在
    fs.mkdirSync(userDir, { recursive: true });
    
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});
```

### 4. 图片压缩处理

```javascript
import sharp from 'sharp';

router.post('/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未上传图片' });
    }
    
    const originalPath = req.file.path;
    const thumbnailFilename = `thumb-${req.file.filename}`;
    const thumbnailPath = path.join(path.dirname(originalPath), thumbnailFilename);
    
    // 使用 sharp 创建缩略图
    await sharp(originalPath)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    res.json({
      original: `/uploads/${req.file.filename}`,
      thumbnail: `/uploads/${thumbnailFilename}`
    });
    
  } catch (error) {
    res.status(500).json({ message: '图片处理失败' });
  }
});
```

## 错误处理

### 全局 Multer 错误处理

```javascript
import multer from 'multer';

// 错误处理中间件
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Multer 特定错误
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          message: '文件大小超出限制（最大 10MB）' 
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          message: '文件数量超出限制' 
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          message: '意外的文件字段' 
        });
      default:
        return res.status(400).json({ 
          message: `上传错误: ${error.message}` 
        });
    }
  } else if (error) {
    // 自定义错误（如文件类型验证失败）
    return res.status(400).json({ 
      message: error.message 
    });
  }
  next();
};

// 使用示例
router.post('/upload', 
  upload.single('file'), 
  handleUploadError,
  (req, res) => {
    res.json({ success: true });
  }
);
```

## 静态文件服务

```javascript
// index.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 提供静态文件访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 现在可以通过 http://localhost:5001/uploads/filename.jpg 访问上传的文件
```

## 安全最佳实践

### 1. 文件类型双重验证

```javascript
import { fileTypeFromBuffer } from 'file-type';

// 验证实际文件内容而不仅仅是扩展名
const validateFileContent = async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  // 读取文件前几个字节检测实际类型
  const buffer = fs.readFileSync(req.file.path);
  const type = await fileTypeFromBuffer(buffer);
  
  if (!type || !ALLOWED_IMAGE_TYPES.includes(type.mime)) {
    // 删除可疑文件
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ 
      message: '文件类型验证失败' 
    });
  }
  
  next();
};
```

### 2. 文件名安全处理

```javascript
import sanitize from 'sanitize-filename';

filename: function (req, file, cb) {
  // 清理原始文件名中的危险字符
  const safeOriginalName = sanitize(file.originalname);
  const ext = path.extname(safeOriginalName);
  const uniqueFilename = `${uuidv4()}${ext}`;
  cb(null, uniqueFilename);
}
```

### 3. 上传目录权限

```bash
# 确保上传目录不可执行
chmod 644 uploads/*
```

### 4. 病毒扫描（生产环境）

```javascript
import ClamScan from 'clamscan';

const clam = await new ClamScan().init({
  clamdscan: {
    socket: '/var/run/clamav/clamd.sock'
  }
});

const scanFile = async (req, res, next) => {
  if (!req.file) return next();
  
  try {
    const { isInfected } = await clam.scanFile(req.file.path);
    if (isInfected) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: '文件安全检查未通过' });
    }
    next();
  } catch (error) {
    next(error);
  }
};
```

## 前端上传示例

```jsx
// React 组件
const ImageUpload = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const response = await axiosInstance.post('/clothing/1/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`上传进度: ${percent}%`);
        }
      });
      onUpload(response.image);
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <input 
      type="file" 
      accept="image/*" 
      onChange={handleUpload}
      disabled={uploading}
    />
  );
};
```

---

## 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2026-01-20 | 初始化文档 |
