# 火山引擎 Ark AI 服务集成指南

## 概述
本文档描述如何在 Node.js + Express 项目中集成火山引擎 Ark AI 服务，使用 Doubao-Seedream 模型实现图片生成功能，并支持 Mock 模式进行开发测试。

## 适用场景
- Node.js + Express 后端项目
- 需要集成 AI 图片生成功能（如文生图、图生图、虚拟试穿等）
- 需要支持无 API Key 时的 Mock 模式
- 需要存储 AI 生成历史记录
- 优先使用国内 AI 服务（无需翻墙）

---

## 1. 火山引擎账号准备

### 1.1 注册账号
1. 访问 [火山引擎官网](https://www.volcengine.com)
2. 点击「立即注册」完成账号注册

### 1.2 获取 API Key
1. 登录后访问 [火山方舟控制台](https://console.volcengine.com/ark)
2. 在左侧菜单找到「系统管理」→「API Key 管理」
3. 点击「创建 API Key」
4. 复制生成的 API Key（**注意：只显示一次，请妥善保存**）

### 1.3 开通模型
1. 在控制台访问「智能广场」→「模型广场」
2. 找到需要的模型（如 Doubao-Seedream-4.5）
3. 点击「开通管理」激活模型

---

## 2. 环境变量配置

在 `.env` 文件中添加：

```env
# 火山引擎 Ark API 配置
# 从 https://console.volcengine.com/ark 系统管理/API Key管理 获取
ARK_API_KEY=your_ark_api_key_here
```

---

## 3. AI 服务模块设计 (`services/aiService.js`)

### 3.1 核心架构

```javascript
import dotenv from 'dotenv';

dotenv.config();

// 火山引擎 Ark API 配置
const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

// Doubao-Seedream-4.5 模型 ID
const SEEDREAM_MODEL_ID = 'doubao-seedream-4-5-251128';

// 检查是否为 Mock 模式
const isMockMode = !ARK_API_KEY;

// Mock 数据（用于开发测试）
const MOCK_GENERATED_IMAGES = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600',
];
```

### 3.2 API 调用函数

```javascript
/**
 * 调用火山引擎 Ark 图片生成 API
 */
async function callArkImageGeneration(prompt, referenceImages = []) {
  const requestBody = {
    model: SEEDREAM_MODEL_ID,
    prompt: prompt,
    size: '1024x1024',
    response_format: 'url',
  };

  // 如果有参考图片，添加到请求中
  if (referenceImages.length > 0) {
    requestBody.image = referenceImages[0];
  }

  const response = await fetch(`${ARK_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARK_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
  }

  return response.json();
}
```

### 3.3 图片生成函数模板

```javascript
export async function generateImage({ prompt, referenceImages = [] }) {
  // Mock 模式处理
  if (isMockMode) {
    console.log('⚠️ AI 服务运行在 Mock 模式（未配置 ARK_API_KEY）');
    
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
    const result = await callArkImageGeneration(prompt, referenceImages);
    
    // 火山引擎返回格式：{ data: [{ url: "..." }] }
    const imageUrl = result.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('API 返回数据格式错误');
    }

    return {
      success: true,
      imageUrl: imageUrl,
      isMock: false,
      message: '图片生成成功'
    };

  } catch (error) {
    console.error('AI 生成失败:', error);
    return {
      success: false,
      error: error.message,
      message: '火山引擎 API 调用失败'
    };
  }
}
```

### 3.4 服务状态检查函数

```javascript
export function getAIServiceStatus() {
  return {
    available: true,
    mockMode: isMockMode,
    provider: '火山引擎',
    model: 'Doubao-Seedream-4.5',
    modelId: SEEDREAM_MODEL_ID,
    pricing: '0.25 元/张',
    message: isMockMode 
      ? '运行在 Mock 模式，请配置 ARK_API_KEY 以启用真实 AI 功能'
      : 'AI 服务已就绪'
  };
}
```

---

## 4. 可用模型参考

### 4.1 图片生成模型

| 模型名称 | Model ID | 能力 | 价格 |
|---------|----------|------|------|
| Doubao-Seedream-4.5 | `doubao-seedream-4-5-251128` | 文生图、图生图、组图 | 0.25 元/张 |
| Doubao-Seedream-4.0 | `doubao-seedream-4-0-xxxxxx` | 文生图、图生图 | 0.20 元/张 |
| Doubao-Seedream-3.0-t2i | `doubao-seedream-3-0-t2i-xxxxxx` | 文生图 | 0.15 元/张 |
| Doubao-SeedEdit-3.0-i2i | `doubao-seededit-3-0-i2i-xxxxxx` | 图片编辑 | 0.20 元/张 |

### 4.2 多模态对话模型（用于 AI 助手）

| 模型名称 | Model ID | 能力 | 定价 |
|---------|----------|------|------|
| Doubao-Seed-1.6-lite | `doubao-seed-1-6-lite-251015` | 文本+图片输入 | 0.3/0.6 元/百万tokens |
| Doubao-Seed-1.8 | `doubao-seed-1-8-xxxxxx` | 多模态 Agent | 按需 |

---

## 5. API 端点参考

### 5.1 图片生成 API

**端点:** `POST https://ark.cn-beijing.volces.com/api/v3/images/generations`

**请求体:**
```json
{
  "model": "doubao-seedream-4-5-251128",
  "prompt": "描述要生成的图片内容",
  "size": "1024x1024",
  "response_format": "url",
  "image": "可选，参考图片URL"
}
```

**响应:**
```json
{
  "created": 1699000000,
  "data": [
    {
      "url": "https://xxx.volcenginecdn.com/generated-image.jpg"
    }
  ]
}
```

### 5.2 对话 API (Chat Completions)

**端点:** `POST https://ark.cn-beijing.volces.com/api/v3/chat/completions`

**请求体:**
```json
{
  "model": "doubao-seed-1-6-lite-251015",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "描述这张图片"},
        {"type": "image_url", "image_url": {"url": "图片URL"}}
      ]
    }
  ]
}
```

---

## 6. 数据模型设计

### 6.1 历史记录模型

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
  prompt: {
    type: DataTypes.TEXT,
    comment: '生成提示词'
  },
  inputImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '输入参考图片 URL'
  },
  generatedImageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '生成的图片 URL'
  },
  modelId: {
    type: DataTypes.STRING,
    comment: '使用的模型 ID'
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
  cost: {
    type: DataTypes.DECIMAL(10, 4),
    comment: '本次生成费用（元）'
  }
});

User.hasMany(AIGenerationHistory, { foreignKey: 'userId' });
AIGenerationHistory.belongsTo(User, { foreignKey: 'userId' });

export default AIGenerationHistory;
```

---

## 7. 前端集成模式

### 7.1 服务状态显示

```jsx
// 显示服务提供商和 Mock 模式警告
<div className="ai-status">
  <span>AI 服务: {aiStatus?.provider}</span>
  {aiStatus?.mockMode && (
    <div className="warning-banner">
      ⚠️ {aiStatus.message}
    </div>
  )}
</div>
```

### 7.2 费用提示

```jsx
// 在生成前显示预估费用
<div className="pricing-info">
  <span>预估费用: {aiStatus?.pricing}</span>
</div>
```

---

## 8. 测试策略

### 8.1 Mock 模式测试

```javascript
describe('AI Routes (Mock Mode)', () => {
  beforeAll(() => {
    // 确保测试环境不设置 ARK_API_KEY
    delete process.env.ARK_API_KEY;
  });

  it('should return AI service status with mock mode', async () => {
    const response = await request(app)
      .get('/api/ai/status')
      .expect(200);

    expect(response.body).toHaveProperty('mockMode', true);
    expect(response.body).toHaveProperty('provider', '火山引擎');
  });

  it('should generate image in mock mode', async () => {
    const response = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ prompt: '测试图片' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('isMock', true);
  });
});
```

---

## 9. 与 Replicate 的对比

| 特性 | 火山引擎 Ark | Replicate |
|------|-------------|-----------|
| **服务商** | 字节跳动（国内） | 美国 |
| **网络** | 国内直连 | 需要翻墙/代理 |
| **支付** | 支持人民币 | 需要美元/信用卡 |
| **模型** | Doubao 系列 | 多种开源模型 |
| **图片生成定价** | 0.25 元/张 | ~$0.023/次 |
| **虚拟试穿** | 暂无专用模型 | IDM-VTON |
| **SDK** | HTTP API | 官方 Node.js SDK |

---

## 10. 最佳实践

1. **Mock 模式支持**: 始终提供 Mock 模式，方便开发和演示
2. **超时处理**: AI 生成可能耗时较长，设置合理的前端超时（30秒+）
3. **费用监控**: 记录每次生成的费用，定期统计
4. **错误处理**: 区分网络错误、认证错误、模型错误等
5. **用户反馈**: 生成过程中提供明确的加载状态
6. **结果缓存**: 对相同输入可考虑缓存结果，节省费用

---

## 11. 安全注意事项

1. **API Key 保护**: 永远不要在前端暴露 API Key
2. **请求限流**: 对生成接口添加速率限制
3. **输入验证**: 验证用户提交的 prompt 和图片 URL
4. **费用限制**: 设置单用户每日生成次数限制
5. **内容审核**: 火山引擎有内置安全审核，但建议额外添加业务层审核

---

## 12. 常见问题

### Q: 为什么选择火山引擎而不是 Replicate?
A: 火山引擎是国内服务，无需翻墙，支持人民币支付，网络延迟更低，适合国内用户使用。

### Q: Seedream 可以做虚拟试穿吗?
A: Seedream 是通用图片生成模型，可以通过精心设计的 prompt 实现类似效果，但效果可能不如专用虚拟试穿模型（如 IDM-VTON）。

### Q: 如何控制生成费用?
A: 
- 使用 Mock 模式进行开发测试
- 设置每日生成次数限制
- 在 UI 上明确显示费用提示
- 定期检查用量统计

---

## 13. 参考链接

- [火山方舟官网](https://www.volcengine.com/product/ark)
- [火山方舟 API 文档](https://www.volcengine.com/docs/82379/1099455)
- [Doubao-Seedream 模型介绍](https://console.volcengine.com/ark/region:ark+cn-beijing/model/detail?Id=doubao-seedream-4-5)
- [API Key 管理](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)
