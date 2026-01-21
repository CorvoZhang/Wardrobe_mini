import request from 'supertest';
import app from '../index.js';
import User from '../models/User.js';
import Clothing from '../models/Clothing.js';
import ClothingCategory from '../models/ClothingCategory.js';
import ClothingImage from '../models/ClothingImage.js';
import TryOnHistory from '../models/TryOnHistory.js';
import sequelize from '../config/database.js';

// 模拟JWT token生成
import { generateToken } from '../middleware/auth.js';

describe('TryOn Routes', () => {
  let testUser;
  let testToken;
  let testCategory;
  let testClothing;

  // 在所有测试前同步数据库并创建测试数据
  beforeAll(async () => {
    await sequelize.sync({ force: true }); // 重置数据库

    // 创建测试分类
    testCategory = await ClothingCategory.create({
      name: '上衣',
      order: 1
    });

    // 创建测试用户
    testUser = await User.create({
      email: 'tryon@example.com',
      password_hash: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // password123
      name: 'TryOn Test User',
      phone: '1234567890'
    });

    // 生成测试token
    testToken = generateToken(testUser);

    // 创建测试衣物
    testClothing = await Clothing.create({
      userId: testUser.id,
      name: '测试上衣',
      categoryId: testCategory.id
    });

    // 创建测试衣物图片
    await ClothingImage.create({
      clothingId: testClothing.id,
      imageUrl: 'https://example.com/test-clothing.jpg'
    });
  });

  // 在每个测试后清理试穿历史数据
  afterEach(async () => {
    await TryOnHistory.destroy({ where: {} });
  });

  // 测试获取 AI 服务状态
  describe('GET /api/tryon/status', () => {
    it('should get AI service status', async () => {
      const response = await request(app)
        .get('/api/tryon/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('available');
      expect(response.body).toHaveProperty('mockMode');
      expect(response.body).toHaveProperty('provider');
      expect(response.body).toHaveProperty('model');
      expect(response.body).toHaveProperty('message');
      expect(response.body.available).toBe(true);
    });
  });

  // 测试获取预设模特列表
  describe('GET /api/tryon/models', () => {
    it('should get preset model list', async () => {
      const response = await request(app)
        .get('/api/tryon/models')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('models');
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(response.body.models.length).toBeGreaterThan(0);

      // 验证模特数据结构
      const model = response.body.models[0];
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('gender');
      expect(model).toHaveProperty('imageUrl');
    });
  });

  // 测试获取预设场景列表
  describe('GET /api/tryon/scenes', () => {
    it('should get all preset scenes', async () => {
      const response = await request(app)
        .get('/api/tryon/scenes')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('scenes');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('groupedScenes');
      expect(response.body).toHaveProperty('categoryNames');
      expect(Array.isArray(response.body.scenes)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
      // 验证至少有20个场景
      expect(response.body.total).toBeGreaterThanOrEqual(20);
    });

    it('should filter scenes by category', async () => {
      const response = await request(app)
        .get('/api/tryon/scenes?category=outdoor')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('scenes');
      expect(Array.isArray(response.body.scenes)).toBe(true);
      
      // 验证所有返回的场景都是outdoor分类
      response.body.scenes.forEach(scene => {
        expect(scene.category).toBe('outdoor');
      });
    });

    it('should return grouped scenes by category', async () => {
      const response = await request(app)
        .get('/api/tryon/scenes')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.groupedScenes).toHaveProperty('outdoor');
      expect(response.body.groupedScenes).toHaveProperty('indoor');
      expect(response.body.groupedScenes).toHaveProperty('formal');
      expect(response.body.groupedScenes).toHaveProperty('casual');
      expect(response.body.groupedScenes).toHaveProperty('seasonal');
      expect(response.body.groupedScenes).toHaveProperty('special');
    });

    it('should have correct scene structure', async () => {
      const response = await request(app)
        .get('/api/tryon/scenes')
        .expect('Content-Type', /json/)
        .expect(200);

      const scene = response.body.scenes[0];
      expect(scene).toHaveProperty('id');
      expect(scene).toHaveProperty('name');
      expect(scene).toHaveProperty('category');
      expect(scene).toHaveProperty('imageUrl');
      expect(scene).toHaveProperty('description');
    });
  });

  // 测试获取单个场景详情
  describe('GET /api/tryon/scenes/:id', () => {
    it('should get single scene detail', async () => {
      const response = await request(app)
        .get('/api/tryon/scenes/outdoor_street')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('scene');
      expect(response.body.scene.id).toBe('outdoor_street');
      expect(response.body.scene).toHaveProperty('name');
      expect(response.body.scene).toHaveProperty('imageUrl');
    });

    it('should return 404 for non-existent scene', async () => {
      const response = await request(app)
        .get('/api/tryon/scenes/non_existent_scene')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('场景不存在');
    });
  });

  // 测试生成虚拟试穿图片
  describe('POST /api/tryon/generate', () => {
    it('should generate try-on image with preset model', async () => {
      const response = await request(app)
        .post('/api/tryon/generate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          clothingId: testClothing.id,
          presetModelId: 'female_1',
          category: 'upper_body'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('generatedImageUrl');
      expect(response.body.data).toHaveProperty('id');
      // Mock 模式下应该返回 isMock: true
      expect(response.body.data).toHaveProperty('isMock');
    });

    it('should accept custom model URL in request', async () => {
      const response = await request(app)
        .post('/api/tryon/generate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          clothingId: testClothing.id,
          modelImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=900&fit=crop',
          category: 'upper_body'
        })
        .expect('Content-Type', /json/);

      // 请求应该被处理（成功或失败都可以，取决于 API 配置）
      expect(response.body).toHaveProperty('success');
      if (response.body.success) {
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('generatedImageUrl');
      }
    });

    it('should not generate without clothingId', async () => {
      const response = await request(app)
        .post('/api/tryon/generate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          presetModelId: 'female_1'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('请提供衣物 ID');
    });

    it('should not generate without model selection', async () => {
      const response = await request(app)
        .post('/api/tryon/generate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          clothingId: testClothing.id
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('请提供模特图片或选择预设模特');
    });

    it('should return 404 for non-existent clothing', async () => {
      const response = await request(app)
        .post('/api/tryon/generate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          clothingId: '00000000-0000-0000-0000-000000000000',
          presetModelId: 'female_1'
        })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('未找到该衣物或无权访问');
    });

    it('should not generate without authentication', async () => {
      const response = await request(app)
        .post('/api/tryon/generate')
        .send({
          clothingId: testClothing.id,
          presetModelId: 'female_1'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });

    it('should return error for invalid preset model ID', async () => {
      const response = await request(app)
        .post('/api/tryon/generate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          clothingId: testClothing.id,
          presetModelId: 'invalid_model_id'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('无效的预设模特 ID');
    });

    it('should generate try-on image with scene', async () => {
      const response = await request(app)
        .post('/api/tryon/generate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          clothingId: testClothing.id,
          presetModelId: 'female_1',
          category: 'upper_body',
          sceneId: 'outdoor_street'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('generatedImageUrl');
      expect(response.body.data).toHaveProperty('scene');
      expect(response.body.data.scene).toHaveProperty('id', 'outdoor_street');
      expect(response.body.data.scene).toHaveProperty('name');
    });

    it('should return error for invalid scene ID', async () => {
      const response = await request(app)
        .post('/api/tryon/generate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          clothingId: testClothing.id,
          presetModelId: 'female_1',
          sceneId: 'invalid_scene_id'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('无效的场景 ID');
    });
  });

  // 测试获取试穿历史
  describe('GET /api/tryon/history', () => {
    it('should get try-on history for authenticated user', async () => {
      // 先创建一条试穿记录
      await TryOnHistory.create({
        userId: testUser.id,
        clothingId: testClothing.id,
        modelImageUrl: 'https://example.com/model.jpg',
        modelType: 'preset',
        presetModelId: 'female_1',
        clothingImageUrl: 'https://example.com/clothing.jpg',
        generatedImageUrl: 'https://example.com/generated.jpg',
        category: 'upper_body',
        isMock: true,
        status: 'completed'
      });

      const response = await request(app)
        .get('/api/tryon/history')
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
    });

    it('should return empty history for new user', async () => {
      const response = await request(app)
        .get('/api/tryon/history')
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should not get history without authentication', async () => {
      const response = await request(app)
        .get('/api/tryon/history')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });

    it('should support pagination', async () => {
      // 创建多条记录
      for (let i = 0; i < 5; i++) {
        await TryOnHistory.create({
          userId: testUser.id,
          clothingId: testClothing.id,
          modelImageUrl: 'https://example.com/model.jpg',
          modelType: 'preset',
          clothingImageUrl: 'https://example.com/clothing.jpg',
          generatedImageUrl: `https://example.com/generated-${i}.jpg`,
          category: 'upper_body',
          isMock: true,
          status: 'completed'
        });
      }

      const response = await request(app)
        .get('/api/tryon/history?page=1&limit=2')
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.totalPages).toBe(3);
    });
  });

  // 测试获取单条试穿记录
  describe('GET /api/tryon/history/:id', () => {
    it('should get single try-on record', async () => {
      const record = await TryOnHistory.create({
        userId: testUser.id,
        clothingId: testClothing.id,
        modelImageUrl: 'https://example.com/model.jpg',
        modelType: 'preset',
        presetModelId: 'female_1',
        clothingImageUrl: 'https://example.com/clothing.jpg',
        generatedImageUrl: 'https://example.com/generated.jpg',
        category: 'upper_body',
        isMock: true,
        status: 'completed'
      });

      const response = await request(app)
        .get(`/api/tryon/history/${record.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.id).toBe(record.id);
      expect(response.body.data.generatedImageUrl).toBe('https://example.com/generated.jpg');
    });

    it('should return 404 for non-existent record', async () => {
      const response = await request(app)
        .get('/api/tryon/history/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('未找到该试穿记录');
    });
  });

  // 测试删除试穿记录
  describe('DELETE /api/tryon/history/:id', () => {
    it('should delete try-on record', async () => {
      const record = await TryOnHistory.create({
        userId: testUser.id,
        clothingId: testClothing.id,
        modelImageUrl: 'https://example.com/model.jpg',
        modelType: 'preset',
        clothingImageUrl: 'https://example.com/clothing.jpg',
        generatedImageUrl: 'https://example.com/generated.jpg',
        category: 'upper_body',
        isMock: true,
        status: 'completed'
      });

      const response = await request(app)
        .delete(`/api/tryon/history/${record.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toBe('试穿记录已删除');

      // 验证记录已删除
      const deletedRecord = await TryOnHistory.findByPk(record.id);
      expect(deletedRecord).toBeNull();
    });

    it('should return 404 when deleting non-existent record', async () => {
      const response = await request(app)
        .delete('/api/tryon/history/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('未找到该试穿记录');
    });

    it('should not delete without authentication', async () => {
      const record = await TryOnHistory.create({
        userId: testUser.id,
        clothingId: testClothing.id,
        modelImageUrl: 'https://example.com/model.jpg',
        modelType: 'preset',
        clothingImageUrl: 'https://example.com/clothing.jpg',
        generatedImageUrl: 'https://example.com/generated.jpg',
        category: 'upper_body',
        isMock: true,
        status: 'completed'
      });

      const response = await request(app)
        .delete(`/api/tryon/history/${record.id}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });
  });
});
