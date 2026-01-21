import dotenv from 'dotenv';
import Replicate from 'replicate';

dotenv.config();

// 火山引擎 Ark API 配置
const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

// Replicate API 配置（用于图像分割）
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const replicate = REPLICATE_API_TOKEN ? new Replicate({ auth: REPLICATE_API_TOKEN }) : null;

// Doubao-Seedream-4.0 模型 ID
const SEEDREAM_MODEL_ID = 'doubao-seedream-4-0-250828';

// 检查是否为 Mock 模式
const isMockMode = !ARK_API_KEY;

// Mock 图片 URL（用于开发测试）
const MOCK_GENERATED_IMAGES = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600',
];

/**
 * 调用火山引擎 Ark API 生成图片
 * @param {string} prompt - 图片生成提示词
 * @param {string[]} referenceImages - 参考图片 URL 数组（可选）
 * @returns {Promise<Object>} - 生成结果
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
    requestBody.image = referenceImages[0]; // Seedream 支持单图输入作为参考
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
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    console.error('❌ 火山引擎 API 错误:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(errorData.error?.message || errorData.message || `API 请求失败: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * 虚拟试穿图片生成服务
 * 使用火山引擎 Doubao-Seedream-4.0 模型生成试穿效果图
 * @param {Object} options - 生成选项
 * @param {string} options.clothingImageUrl - 衣物图片URL
 * @param {string} options.modelImageUrl - 模特图片URL
 * @param {string} options.category - 衣物类别 (upper_body/lower_body/dresses)
 * @param {Object} options.clothingInfo - 衣物信息
 * @param {Object} options.scene - 场景信息（可选）
 */
export async function generateTryOnImage({ 
  clothingImageUrl, 
  modelImageUrl,
  category = 'upper_body',
  clothingInfo = {},
  scene = null
}) {
  // Mock 模式：返回模拟数据
  if (isMockMode) {
    console.log('⚠️ AI 服务运行在 Mock 模式（未配置 ARK_API_KEY）');
    
    // 模拟 AI 处理延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 返回随机 mock 图片
    const randomIndex = Math.floor(Math.random() * MOCK_GENERATED_IMAGES.length);
    return {
      success: true,
      imageUrl: MOCK_GENERATED_IMAGES[randomIndex],
      isMock: true,
      message: 'Mock 模式生成的示例图片',
      scene: scene ? { id: scene.id, name: scene.name } : null
    };
  }

  try {
    console.log('🎨 开始生成虚拟试穿图片...');
    console.log('  - 衣物图片:', clothingImageUrl);
    console.log('  - 模特图片:', modelImageUrl);
    console.log('  - 类别:', category);
    console.log('  - 场景:', scene ? scene.name : '默认');

    // 构建详细的衣物描述
    const clothingDescription = [
      clothingInfo.name && `a ${clothingInfo.name}`,
      clothingInfo.color && `in ${clothingInfo.color} color`,
      clothingInfo.style && `with ${clothingInfo.style} style`,
      clothingInfo.brand && `from ${clothingInfo.brand} brand`
    ].filter(Boolean).join(', ') || 'the clothing item';

    const categoryDesc = {
      'upper_body': 'upper body clothing',
      'lower_body': 'lower body clothing',
      'dresses': 'dress'
    };

    // 构建场景描述
    let sceneDescription = '';
    let lightingDescription = 'natural lighting';
    let backgroundDescription = 'clean background';
    
    if (scene) {
      sceneDescription = scene.promptKeywords || scene.nameEn || scene.name;
      lightingDescription = scene.lightingStyle || 'natural lighting';
      backgroundDescription = scene.backgroundStyle || 'appropriate background';
    }

    // 使用更精确的提示词，强调虚拟试穿效果和场景
    const prompt = `Virtual try-on fashion photography. The person in the reference image should be wearing ${clothingDescription} (${categoryDesc[category] || 'clothing'}). 
    
IMPORTANT REQUIREMENTS:
1. The clothing must be properly fitted and worn on the person's body
2. The clothing should replace the original clothing in the reference image
3. Keep the person's face, skin tone, body shape, and pose exactly the same
4. The clothing should look natural and realistic, as if the person is actually wearing it
5. Do NOT simply copy the reference image - the clothing must be changed

${scene ? `SCENE REQUIREMENTS:
- Setting: ${sceneDescription}
- Background: ${backgroundDescription}
- Lighting: ${lightingDescription}
` : ''}
Style: Professional fashion photography, high quality, photorealistic, ${lightingDescription}.`;

    // 调用火山引擎 Ark API
    const result = await callArkImageGeneration(prompt, [modelImageUrl]);

    console.log('✅ 虚拟试穿图片生成成功');

    // 火山引擎返回格式：{ data: [{ url: "..." }] }
    const imageUrl = result.data?.[0]?.url || result.data?.[0]?.b64_json;

    if (!imageUrl) {
      throw new Error('API 返回数据格式错误');
    }

    return {
      success: true,
      imageUrl: imageUrl,
      isMock: false,
      message: '虚拟试穿图片生成成功',
      scene: scene ? { id: scene.id, name: scene.name } : null
    };

  } catch (error) {
    console.error('❌ 虚拟试穿图片生成失败:', error);
    
    return {
      success: false,
      error: error.message,
      message: '火山引擎 API 调用失败'
    };
  }
}

/**
 * 文本生成图片服务
 * 使用火山引擎 Doubao-Seedream-4.0 模型根据文本描述生成图片
 */
export async function generateImageFromText(prompt, options = {}) {
  if (isMockMode) {
    console.log('⚠️ AI 服务运行在 Mock 模式（未配置 ARK_API_KEY）');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const randomIndex = Math.floor(Math.random() * MOCK_GENERATED_IMAGES.length);
    return {
      success: true,
      imageUrl: MOCK_GENERATED_IMAGES[randomIndex],
      isMock: true,
      message: 'Mock 模式生成的示例图片'
    };
  }

  try {
    console.log('🎨 开始文生图...');
    console.log('  - Prompt:', prompt);

    const result = await callArkImageGeneration(prompt);

    console.log('✅ 图片生成成功');

    const imageUrl = result.data?.[0]?.url || result.data?.[0]?.b64_json;

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
    console.error('❌ 图片生成失败:', error);
    return {
      success: false,
      error: error.message,
      message: '火山引擎 API 调用失败'
    };
  }
}

/**
 * 检查 AI 服务状态
 */
export function getAIServiceStatus() {
  return {
    available: true,
    mockMode: isMockMode,
    provider: '火山引擎',
    model: 'Doubao-Seedream-4.0',
    modelId: SEEDREAM_MODEL_ID,
    pricing: '请查看火山引擎控制台定价',
    backgroundRemovalAvailable: !!replicate,
    message: isMockMode 
      ? '运行在 Mock 模式，请配置 ARK_API_KEY 以启用真实 AI 功能'
      : 'AI 服务已就绪'
  };
}

/**
 * AI 图像分割 - 去除衣物背景
 * 使用 Replicate 的 rembg 模型去除图片背景
 * @param {string} imageUrl - 原始图片 URL
 * @returns {Promise<Object>} - 处理结果
 */
export async function removeBackground(imageUrl) {
  // Mock 模式处理
  if (!replicate) {
    console.log('⚠️ 背景去除服务运行在 Mock 模式（未配置 REPLICATE_API_TOKEN）');
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 返回 Mock 数据（使用透明背景的示例图片）
    return {
      success: true,
      processedImageUrl: imageUrl, // Mock 模式下返回原图
      isMock: true,
      message: 'Mock 模式：背景去除功能需要配置 REPLICATE_API_TOKEN'
    };
  }

  try {
    console.log('🎨 开始去除图片背景...');
    console.log('  - 原始图片:', imageUrl);

    // 使用 rembg 模型去除背景
    // rembg 是一个流行的背景去除模型，支持多种物体类型
    const output = await replicate.run(
      "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
      {
        input: {
          image: imageUrl
        }
      }
    );

    console.log('✅ 背景去除成功');

    // Replicate 返回的是处理后图片的 URL
    const processedImageUrl = output;

    if (!processedImageUrl) {
      throw new Error('背景去除失败：未返回处理后的图片');
    }

    return {
      success: true,
      processedImageUrl: processedImageUrl,
      isMock: false,
      message: '背景去除成功'
    };

  } catch (error) {
    console.error('❌ 背景去除失败:', error);
    
    return {
      success: false,
      error: error.message,
      message: '背景去除失败，请稍后重试'
    };
  }
}

/**
 * AI 衣物属性自动识别
 * 使用 AI 分析衣物图片，自动识别颜色、风格、季节等属性
 * @param {string} imageUrl - 衣物图片 URL
 * @returns {Promise<Object>} - 识别结果
 */
export async function recognizeClothingAttributes(imageUrl) {
  // Mock 模式处理
  if (isMockMode) {
    console.log('⚠️ 衣物属性识别运行在 Mock 模式');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 返回 Mock 数据
    const mockAttributes = {
      color: ['黑色', '白色', '灰色', '蓝色', '红色'][Math.floor(Math.random() * 5)],
      style: ['休闲', '正式', '运动', '街头', '复古'][Math.floor(Math.random() * 5)],
      season: ['春季', '夏季', '秋季', '冬季', '四季'][Math.floor(Math.random() * 5)],
      material: ['棉', '涤纶', '羊毛', '丝绸', '牛仔'][Math.floor(Math.random() * 5)],
      pattern: ['纯色', '条纹', '格子', '印花', '图案'][Math.floor(Math.random() * 5)],
      confidence: 0.85
    };
    
    return {
      success: true,
      attributes: mockAttributes,
      isMock: true,
      message: 'Mock 模式：属性识别功能需要配置 ARK_API_KEY'
    };
  }

  try {
    console.log('🔍 开始识别衣物属性...');
    console.log('  - 图片:', imageUrl);

    // 使用火山引擎的视觉模型进行属性识别
    // 构建提示词让模型分析衣物图片
    const prompt = `请分析这张衣物图片，识别以下属性并以JSON格式返回：
1. color: 主要颜色（中文）
2. style: 风格（休闲/正式/运动/街头/复古等）
3. season: 适合季节（春季/夏季/秋季/冬季/四季）
4. material: 可能的材质（棉/涤纶/羊毛/丝绸/牛仔等）
5. pattern: 图案类型（纯色/条纹/格子/印花/图案等）

只返回JSON对象，不要其他文字。`;

    // 调用火山引擎视觉理解 API（如果支持）
    // 这里使用简化的实现，实际可能需要调用专门的视觉理解模型
    const response = await fetch(`${ARK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'doubao-vision-pro-32k',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    // 解析 JSON 响应
    const attributes = JSON.parse(content);

    console.log('✅ 衣物属性识别成功');

    return {
      success: true,
      attributes: {
        ...attributes,
        confidence: 0.9
      },
      isMock: false,
      message: '属性识别成功'
    };

  } catch (error) {
    console.error('❌ 衣物属性识别失败:', error);
    
    return {
      success: false,
      error: error.message,
      message: '属性识别失败，请稍后重试'
    };
  }
}

/**
 * 预设场景列表 - 共 24 个场景
 * 覆盖户外、室内、正式、休闲、季节性、特殊场合等多种类型
 */
export const PRESET_SCENES = [
  // 户外场景 (Outdoor)
  {
    id: 'outdoor_street',
    name: '城市街道',
    nameEn: 'City Street',
    category: 'outdoor',
    description: '现代都市街道，适合展示日常通勤穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300',
    promptKeywords: 'urban city street, modern architecture, daytime',
    lightingStyle: 'natural daylight',
    backgroundStyle: 'modern city buildings and streets'
  },
  {
    id: 'outdoor_park',
    name: '城市公园',
    nameEn: 'City Park',
    category: 'outdoor',
    description: '绿意盎然的城市公园，适合休闲穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=300',
    promptKeywords: 'city park, green trees, grass, natural setting',
    lightingStyle: 'soft natural light with dappled shadows',
    backgroundStyle: 'lush green park with trees'
  },
  {
    id: 'outdoor_beach',
    name: '海滩沙滩',
    nameEn: 'Beach',
    category: 'outdoor',
    description: '阳光明媚的海滩，适合度假休闲穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300',
    promptKeywords: 'beach, ocean, sand, sunny day, vacation',
    lightingStyle: 'bright sunny beach light',
    backgroundStyle: 'tropical beach with ocean waves'
  },
  {
    id: 'outdoor_snow',
    name: '雪地冬景',
    nameEn: 'Snow Scene',
    category: 'outdoor',
    description: '白雪皑皑的冬日场景，适合冬季保暖穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=300',
    promptKeywords: 'winter snow, snowy landscape, cold weather',
    lightingStyle: 'soft winter light, slightly overcast',
    backgroundStyle: 'snowy winter landscape'
  },
  {
    id: 'outdoor_mountain',
    name: '山野户外',
    nameEn: 'Mountain Outdoor',
    category: 'outdoor',
    description: '壮丽山景，适合运动户外穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300',
    promptKeywords: 'mountain landscape, hiking trail, nature',
    lightingStyle: 'dramatic mountain light',
    backgroundStyle: 'majestic mountain scenery'
  },
  
  // 室内场景 (Indoor)
  {
    id: 'indoor_studio',
    name: '摄影棚',
    nameEn: 'Photo Studio',
    category: 'indoor',
    description: '专业摄影棚纯色背景，突出服装细节',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300',
    promptKeywords: 'professional photo studio, clean background',
    lightingStyle: 'professional studio lighting',
    backgroundStyle: 'clean solid color background'
  },
  {
    id: 'indoor_cafe',
    name: '咖啡馆',
    nameEn: 'Cafe',
    category: 'indoor',
    description: '温馨咖啡馆氛围，适合文艺休闲穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300',
    promptKeywords: 'cozy cafe interior, warm atmosphere',
    lightingStyle: 'warm ambient cafe lighting',
    backgroundStyle: 'stylish cafe interior'
  },
  {
    id: 'indoor_home',
    name: '居家空间',
    nameEn: 'Home Interior',
    category: 'indoor',
    description: '温馨家居环境，适合居家休闲穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300',
    promptKeywords: 'modern home interior, cozy living room',
    lightingStyle: 'soft natural window light',
    backgroundStyle: 'elegant home interior'
  },
  {
    id: 'indoor_mall',
    name: '购物中心',
    nameEn: 'Shopping Mall',
    category: 'indoor',
    description: '现代购物中心，适合时尚潮流穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=300',
    promptKeywords: 'modern shopping mall, fashion retail space',
    lightingStyle: 'bright mall lighting',
    backgroundStyle: 'luxury shopping mall interior'
  },
  
  // 正式场合 (Formal)
  {
    id: 'formal_office',
    name: '办公室',
    nameEn: 'Office',
    category: 'formal',
    description: '专业办公环境，适合商务职场穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300',
    promptKeywords: 'modern office, professional workplace',
    lightingStyle: 'professional office lighting',
    backgroundStyle: 'contemporary office space'
  },
  {
    id: 'formal_conference',
    name: '会议室',
    nameEn: 'Conference Room',
    category: 'formal',
    description: '商务会议场景，适合正式会议穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=300',
    promptKeywords: 'corporate conference room, business meeting',
    lightingStyle: 'professional meeting room lighting',
    backgroundStyle: 'executive conference room'
  },
  {
    id: 'formal_gala',
    name: '晚宴酒会',
    nameEn: 'Gala Evening',
    category: 'formal',
    description: '华丽晚宴场景，适合礼服晚装穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=300',
    promptKeywords: 'elegant gala, evening event, luxury ballroom',
    lightingStyle: 'glamorous evening lighting with chandeliers',
    backgroundStyle: 'luxurious ballroom setting'
  },
  {
    id: 'formal_wedding',
    name: '婚礼场合',
    nameEn: 'Wedding',
    category: 'formal',
    description: '浪漫婚礼场景，适合婚礼宾客穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300',
    promptKeywords: 'romantic wedding venue, celebration',
    lightingStyle: 'romantic soft lighting',
    backgroundStyle: 'beautiful wedding venue'
  },
  
  // 休闲场合 (Casual)
  {
    id: 'casual_campus',
    name: '校园',
    nameEn: 'Campus',
    category: 'casual',
    description: '青春校园场景，适合学生休闲穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=300',
    promptKeywords: 'university campus, academic buildings',
    lightingStyle: 'bright campus daylight',
    backgroundStyle: 'beautiful campus grounds'
  },
  {
    id: 'casual_gym',
    name: '健身房',
    nameEn: 'Gym',
    category: 'casual',
    description: '运动健身场景，适合运动穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300',
    promptKeywords: 'modern gym, fitness center, workout',
    lightingStyle: 'bright gym lighting',
    backgroundStyle: 'fitness gym interior'
  },
  {
    id: 'casual_restaurant',
    name: '餐厅',
    nameEn: 'Restaurant',
    category: 'casual',
    description: '时尚餐厅场景，适合约会聚餐穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300',
    promptKeywords: 'elegant restaurant, dining atmosphere',
    lightingStyle: 'warm restaurant ambiance',
    backgroundStyle: 'stylish restaurant interior'
  },
  {
    id: 'casual_gallery',
    name: '艺术画廊',
    nameEn: 'Art Gallery',
    category: 'casual',
    description: '艺术画廊场景，适合文艺气质穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300',
    promptKeywords: 'modern art gallery, museum',
    lightingStyle: 'clean gallery lighting',
    backgroundStyle: 'minimalist art gallery'
  },
  
  // 季节性场景 (Seasonal)
  {
    id: 'seasonal_spring',
    name: '春日花园',
    nameEn: 'Spring Garden',
    category: 'seasonal',
    description: '春暖花开的花园，适合春季穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300',
    promptKeywords: 'spring garden, cherry blossoms, flowers',
    lightingStyle: 'soft spring sunlight',
    backgroundStyle: 'blooming spring garden'
  },
  {
    id: 'seasonal_summer',
    name: '夏日阳光',
    nameEn: 'Summer Sunshine',
    category: 'seasonal',
    description: '阳光灿烂的夏日，适合夏季清凉穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=300',
    promptKeywords: 'bright summer day, sunny outdoors',
    lightingStyle: 'bright summer sunlight',
    backgroundStyle: 'vibrant summer scene'
  },
  {
    id: 'seasonal_autumn',
    name: '秋日落叶',
    nameEn: 'Autumn Leaves',
    category: 'seasonal',
    description: '金色秋日场景，适合秋季温暖穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    promptKeywords: 'autumn foliage, golden leaves, fall colors',
    lightingStyle: 'warm golden hour autumn light',
    backgroundStyle: 'colorful autumn landscape'
  },
  {
    id: 'seasonal_winter',
    name: '冬日暖阳',
    nameEn: 'Winter Day',
    category: 'seasonal',
    description: '冬日场景，适合冬季保暖时尚穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1477601263568-180e2c6d046e?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1477601263568-180e2c6d046e?w=300',
    promptKeywords: 'winter scene, cold weather, cozy',
    lightingStyle: 'soft winter daylight',
    backgroundStyle: 'crisp winter scene'
  },
  
  // 特殊场合 (Special)
  {
    id: 'special_party',
    name: '派对活动',
    nameEn: 'Party',
    category: 'special',
    description: '热闹派对场景，适合派对时尚穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300',
    promptKeywords: 'party celebration, nightlife, fun atmosphere',
    lightingStyle: 'colorful party lights',
    backgroundStyle: 'vibrant party scene'
  },
  {
    id: 'special_travel',
    name: '旅行度假',
    nameEn: 'Travel Vacation',
    category: 'special',
    description: '旅行场景，适合旅行休闲穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300',
    promptKeywords: 'travel destination, vacation, exploration',
    lightingStyle: 'natural travel photography light',
    backgroundStyle: 'scenic travel location'
  },
  {
    id: 'special_concert',
    name: '演唱会',
    nameEn: 'Concert',
    category: 'special',
    description: '演唱会场景，适合音乐节潮流穿搭',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300',
    promptKeywords: 'music concert, live event, crowd',
    lightingStyle: 'dramatic stage lighting',
    backgroundStyle: 'concert venue atmosphere'
  }
];

/**
 * 预设模特图片列表 - 全身照片
 */
export const PRESET_MODELS = [
  {
    id: 'female_1',
    name: '女性模特 1',
    gender: 'female',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=900&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=300&fit=crop'
  },
  {
    id: 'female_2',
    name: '女性模特 2',
    gender: 'female',
    imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&h=900&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=200&h=300&fit=crop'
  },
  {
    id: 'male_1',
    name: '男性模特 1',
    gender: 'male',
    imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&h=900&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=200&h=300&fit=crop'
  },
  {
    id: 'male_2',
    name: '男性模特 2',
    gender: 'male',
    imageUrl: 'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=600&h=900&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=200&h=300&fit=crop'
  }
];

/**
 * AI 自然语言描述解析
 * 使用 AI 解析用户的自然语言描述，提取衣物/穿搭需求
 * @param {string} description - 用户的自然语言描述
 * @param {string} language - 语言 (zh/en)
 * @returns {Promise<Object>} - 解析结果
 */
export async function parseNaturalLanguage(description, language = 'zh') {
  // Mock 模式处理
  if (isMockMode) {
    console.log('⚠️ 自然语言解析运行在 Mock 模式');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 简单的关键词匹配作为 Mock 逻辑
    const keywords = {
      seasons: {
        zh: ['春季', '夏季', '秋季', '冬季', '春', '夏', '秋', '冬', '春天', '夏天', '秋天', '冬天'],
        en: ['spring', 'summer', 'autumn', 'fall', 'winter']
      },
      occasions: {
        zh: ['日常', '职场', '约会', '聚会', '运动', '正式', '休闲', '婚礼', '晚宴', '面试', '旅行', '通勤'],
        en: ['daily', 'work', 'date', 'party', 'sports', 'formal', 'casual', 'wedding', 'dinner', 'interview', 'travel', 'commute']
      },
      styles: {
        zh: ['休闲', '正式', '运动', '甜美', '简约', '时尚', '复古', '优雅', '街头', '文艺', '商务'],
        en: ['casual', 'formal', 'sports', 'sweet', 'minimalist', 'fashion', 'vintage', 'elegant', 'street', 'artistic', 'business']
      },
      colors: {
        zh: ['黑色', '白色', '红色', '蓝色', '绿色', '黄色', '紫色', '粉色', '灰色', '棕色', '米色', '卡其'],
        en: ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'gray', 'brown', 'beige', 'khaki']
      },
      categories: {
        zh: ['上衣', '裤子', '裙子', '外套', '鞋子', '配饰', '衬衫', 'T恤', '毛衣', '连衣裙', '牛仔裤', '西装'],
        en: ['top', 'pants', 'skirt', 'jacket', 'shoes', 'accessories', 'shirt', 't-shirt', 'sweater', 'dress', 'jeans', 'suit']
      }
    };
    
    const langKeywords = {};
    for (const [key, value] of Object.entries(keywords)) {
      langKeywords[key] = value.zh.concat(value.en);
    }
    
    const lowerDesc = description.toLowerCase();
    
    // 提取匹配的关键词
    const detected = {
      season: null,
      occasion: null,
      style: null,
      color: null,
      category: null
    };
    
    for (const season of langKeywords.seasons) {
      if (lowerDesc.includes(season.toLowerCase())) {
        detected.season = season;
        break;
      }
    }
    
    for (const occasion of langKeywords.occasions) {
      if (lowerDesc.includes(occasion.toLowerCase())) {
        detected.occasion = occasion;
        break;
      }
    }
    
    for (const style of langKeywords.styles) {
      if (lowerDesc.includes(style.toLowerCase())) {
        detected.style = style;
        break;
      }
    }
    
    for (const color of langKeywords.colors) {
      if (lowerDesc.includes(color.toLowerCase())) {
        detected.color = color;
        break;
      }
    }
    
    for (const category of langKeywords.categories) {
      if (lowerDesc.includes(category.toLowerCase())) {
        detected.category = category;
        break;
      }
    }
    
    return {
      success: true,
      parsedResult: detected,
      confidence: 0.75,
      isMock: true,
      message: 'Mock 模式解析完成',
      suggestions: generateMockSuggestions(detected)
    };
  }

  try {
    console.log('🗣️ 开始解析自然语言描述...');
    console.log('  - 描述:', description);

    const prompt = `你是一个专业的时尚穿搭顾问AI。请分析用户的穿搭需求描述，并提取关键信息。

用户描述: "${description}"

请以JSON格式返回以下信息：
{
  "season": "季节（春季/夏季/秋季/冬季/四季，可为null）",
  "occasion": "场合（日常/职场/约会/聚会/运动/正式/休闲/婚礼/晚宴等，可为null）",
  "style": "风格（休闲/正式/运动/甜美/简约/时尚/复古/优雅/街头等，可为null）",
  "color": "颜色偏好（可为null）",
  "category": "衣物类别（上衣/裤子/裙子/外套/鞋子/配饰等，可为null）",
  "keywords": ["其他关键词数组"],
  "intent": "用户意图（寻找衣物/寻找搭配/获取建议）",
  "suggestions": ["3-5条穿搭建议"]
}

只返回JSON对象，不要其他文字。`;

    const response = await fetch(`${ARK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'doubao-pro-32k',
        messages: [
          { role: 'system', content: '你是一个专业的时尚穿搭顾问，擅长理解用户的穿搭需求并提供建议。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    // 解析 JSON 响应
    const parsedResult = JSON.parse(content);

    console.log('✅ 自然语言解析成功');

    return {
      success: true,
      parsedResult: {
        season: parsedResult.season,
        occasion: parsedResult.occasion,
        style: parsedResult.style,
        color: parsedResult.color,
        category: parsedResult.category
      },
      keywords: parsedResult.keywords || [],
      intent: parsedResult.intent || '寻找衣物',
      suggestions: parsedResult.suggestions || [],
      confidence: 0.9,
      isMock: false,
      message: '解析成功'
    };

  } catch (error) {
    console.error('❌ 自然语言解析失败:', error);
    
    // 降级到简单关键词匹配
    return parseNaturalLanguageSimple(description);
  }
}

/**
 * 简单的自然语言解析（作为降级方案）
 */
function parseNaturalLanguageSimple(description) {
  const keywords = {
    seasons: ['春季', '夏季', '秋季', '冬季', '春', '夏', '秋', '冬'],
    occasions: ['日常', '职场', '约会', '聚会', '运动', '正式', '休闲', '婚礼', '晚宴'],
    styles: ['休闲', '正式', '运动', '甜美', '简约', '时尚', '复古', '优雅', '街头'],
    colors: ['黑色', '白色', '红色', '蓝色', '绿色', '黄色', '紫色', '粉色', '灰色'],
    categories: ['上衣', '裤子', '裙子', '外套', '鞋子', '配饰', '衬衫', 'T恤', '毛衣']
  };
  
  const detected = {
    season: null,
    occasion: null,
    style: null,
    color: null,
    category: null
  };
  
  for (const season of keywords.seasons) {
    if (description.includes(season)) {
      detected.season = season.length === 1 ? season + '季' : season;
      break;
    }
  }
  
  for (const occasion of keywords.occasions) {
    if (description.includes(occasion)) {
      detected.occasion = occasion;
      break;
    }
  }
  
  for (const style of keywords.styles) {
    if (description.includes(style)) {
      detected.style = style;
      break;
    }
  }
  
  for (const color of keywords.colors) {
    if (description.includes(color)) {
      detected.color = color;
      break;
    }
  }
  
  for (const category of keywords.categories) {
    if (description.includes(category)) {
      detected.category = category;
      break;
    }
  }
  
  return {
    success: true,
    parsedResult: detected,
    confidence: 0.6,
    isMock: false,
    message: '使用简单关键词匹配',
    suggestions: generateMockSuggestions(detected)
  };
}

/**
 * 生成 Mock 建议
 */
function generateMockSuggestions(detected) {
  const suggestions = [];
  
  if (detected.occasion === '职场' || detected.occasion === '正式') {
    suggestions.push('建议选择简约大方的款式，颜色以黑、白、灰、藏青为主');
    suggestions.push('搭配西装外套或针织开衫，显得更加专业');
  } else if (detected.occasion === '约会') {
    suggestions.push('可以选择温柔的颜色，如粉色、浅蓝色');
    suggestions.push('搭配一条显瘦的裙子或修身裤，展现优雅气质');
  } else if (detected.occasion === '休闲') {
    suggestions.push('选择舒适的面料，如棉质、针织');
    suggestions.push('可以尝试混搭风格，展现个性');
  }
  
  if (detected.season === '夏季' || detected.season === '夏') {
    suggestions.push('选择透气轻薄的面料，如棉麻、雪纺');
  } else if (detected.season === '冬季' || detected.season === '冬') {
    suggestions.push('注重保暖，可选择羊毛、羽绒等材质');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('根据您的需求，建议选择百搭的基础款单品');
    suggestions.push('可以参考当季流行趋势进行搭配');
  }
  
  return suggestions;
}

export default {
  generateTryOnImage,
  generateImageFromText,
  getAIServiceStatus,
  removeBackground,
  recognizeClothingAttributes,
  parseNaturalLanguage,
  PRESET_MODELS,
  PRESET_SCENES
};
