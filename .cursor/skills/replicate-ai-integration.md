# Replicate AI 服务集成指南

## 概述
本文档描述如何在 Node.js + Express 项目中集成 Replicate AI 服务，实现虚拟试穿等 AI 功能，并支持 Mock 模式进行开发测试。

## 适用场景
- Node.js + Express 后端项目
- 需要集成 AI 图片生成功能（如虚拟试穿、图片风格转换等）
- 需要支持无 API Key 时的 Mock 模式
- 需要存储 AI 生成历史记录

---

## 1. 安装依赖

```bash
npm install replicate
```

---

## 2. 环境变量配置

在 `.env` 文件中添加：

```env
# Replicate AI API Token
# 从 https://replicate.com/account/api-tokens 获取
REPLICATE_API_TOKEN=your_api_token_here
```

---

## 3. AI 服务模块设计 (`services/aiService.js`)

### 3.1 核心架构

```javascript
import Replicate from 'replicate';
import dotenv from 'dotenv';

dotenv.config();

// 初始化 Replicate 客户端
const replicate = process.env.REPLICATE_API_TOKEN 
  ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  : null;

// 检查是否为 Mock 模式
const isMockMode = !process.env.REPLICATE_API_TOKEN;

// Mock 数据（用于开发测试）
const MOCK_GENERATED_IMAGES = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600',
];
```

### 3.2 AI 生成函数模板

```javascript
export async function generateImage({ inputImageUrl, ...otherParams }) {
  // Mock 模式处理
  if (isMockMode) {
    console.log('⚠️ AI 服务运行在 Mock 模式');
    
    // 模拟处理延迟（2秒）
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 返回随机 mock 图片
    const randomIndex = Math.floor(Math.random() * MOCK_GENERATED_IMAGES.length);
    return {
      success: true,
      imageUrl: MOCK_GENERATED_IMAGES[randomIndex],
      isMock: true,
      message: 'Mock 模式生成的示例图片'
    };
  }

  try {
    // 调用真实 AI 模型
    const output = await replicate.run(
      'model-owner/model-name:version-hash',
      {
        input: {
          image: inputImageUrl,
          // ... 其他参数
        }
      }
    );

    return {
      success: true,
      imageUrl: Array.isArray(output) ? output[0] : output,
      isMock: false,
      message: '生成成功'
    };

  } catch (error) {
    console.error('AI 生成失败:', error);
    return {
      success: false,
      error: error.message,
      message: '生成失败，请稍后重试'
    };
  }
}
```

### 3.3 服务状态检查函数

```javascript
export function getAIServiceStatus() {
  return {
    available: true,
    mockMode: isMockMode,
    provider: 'Replicate',
    model: 'model-owner/model-name',
    message: isMockMode 
      ? '运行在 Mock 模式，请配置 REPLICATE_API_TOKEN 以启用真实 AI 功能'
      : 'AI 服务已就绪'
  };
}
```

---

## 4. 数据模型设计

### 4.1 历史记录模型

```javascript
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const AIGenerationHistory = sequelize.define('AIGenerationHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    references: { model: User, key: 'id' },
    allowNull: false
  },
  inputImageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '输入图片 URL'
  },
  generatedImageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '生成的图片 URL'
  },
  modelType: {
    type: DataTypes.STRING,
    comment: '使用的 AI 模型类型'
  },
  isMock: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为 Mock 模式生成'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'completed'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// 建立关联
User.hasMany(AIGenerationHistory, { foreignKey: 'userId' });
AIGenerationHistory.belongsTo(User, { foreignKey: 'userId' });

export default AIGenerationHistory;
```

---

## 5. API 路由设计

### 5.1 路由结构

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/api/ai/status` | GET | 获取 AI 服务状态 | 否 |
| `/api/ai/generate` | POST | 生成 AI 图片 | 是 |
| `/api/ai/history` | GET | 获取生成历史 | 是 |
| `/api/ai/history/:id` | GET | 获取单条记录 | 是 |
| `/api/ai/history/:id` | DELETE | 删除记录 | 是 |

### 5.2 路由实现示例

```javascript
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { generateImage, getAIServiceStatus } from '../services/aiService.js';
import AIGenerationHistory from '../models/AIGenerationHistory.js';

const router = express.Router();

// 获取服务状态（无需认证）
router.get('/status', (req, res) => {
  res.json(getAIServiceStatus());
});

// 生成图片（需要认证）
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { inputImageUrl, ...params } = req.body;
    const userId = req.user.id;

    // 参数验证
    if (!inputImageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供输入图片' 
      });
    }

    // 调用 AI 服务
    const result = await generateImage({ inputImageUrl, ...params });

    if (!result.success) {
      return res.status(500).json(result);
    }

    // 保存历史记录
    const history = await AIGenerationHistory.create({
      userId,
      inputImageUrl,
      generatedImageUrl: result.imageUrl,
      isMock: result.isMock,
      status: 'completed'
    });

    res.json({
      success: true,
      data: {
        id: history.id,
        generatedImageUrl: result.imageUrl,
        isMock: result.isMock
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
});

export default router;
```

---

## 6. 前端集成模式

### 6.1 服务状态显示

```jsx
// 显示 Mock 模式警告
{aiStatus?.mockMode && (
  <div className="warning-banner">
    ⚠️ {aiStatus.message}
  </div>
)}
```

### 6.2 生成按钮状态管理

```jsx
const [generating, setGenerating] = useState(false);

const handleGenerate = async () => {
  setGenerating(true);
  try {
    const response = await axiosInstance.post('/ai/generate', payload);
    if (response.success) {
      setResult(response.data);
      // Mock 模式提示
      message.success(
        response.data.isMock 
          ? '生成完成（Mock 模式）' 
          : '生成成功！'
      );
    }
  } catch (error) {
    message.error('生成失败');
  } finally {
    setGenerating(false);
  }
};
```

---

## 7. 测试策略

### 7.1 测试文件结构

```javascript
describe('AI Routes', () => {
  it('should return AI service status', async () => {
    const response = await request(app)
      .get('/api/ai/status')
      .expect(200);

    expect(response.body).toHaveProperty('available', true);
    expect(response.body).toHaveProperty('mockMode');
  });

  it('should generate image in mock mode', async () => {
    const response = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ inputImageUrl: 'https://example.com/image.jpg' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('isMock', true);
  });
});
```

---

## 8. 常见 AI 模型参考

### 虚拟试穿
```javascript
// IDM-VTON 模型
await replicate.run(
  'cuuupid/idm-vton:c871bb9b046c1f1cca73c3c4920c68cc40bdc60dd95e40e6bda28bde88c91c66',
  {
    input: {
      human_img: modelImageUrl,
      garm_img: clothingImageUrl,
      garment_des: 'A piece of clothing',
      category: 'upper_body', // upper_body, lower_body, dresses
      denoise_steps: 30
    }
  }
);
```

### 图片背景移除
```javascript
await replicate.run(
  'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
  { input: { image: imageUrl } }
);
```

---

## 9. 最佳实践

1. **Mock 模式支持**: 始终提供 Mock 模式，方便开发和演示
2. **超时处理**: AI 生成可能耗时较长，设置合理的前端超时
3. **错误记录**: 失败的生成也要记录到历史，方便排查问题
4. **用户反馈**: 生成过程中提供明确的加载状态
5. **结果标识**: 区分 Mock 结果和真实 AI 结果
6. **资源清理**: 定期清理过期的生成记录

---

## 10. 安全注意事项

1. **API Key 保护**: 永远不要在前端暴露 API Key
2. **请求限流**: 对生成接口添加速率限制
3. **输入验证**: 验证用户提交的图片 URL
4. **费用监控**: Replicate 按使用量计费，监控使用情况
