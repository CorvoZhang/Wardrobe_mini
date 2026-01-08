import request from 'supertest';
import app from '../index.js';
import User from '../models/User.js';
import Clothing from '../models/Clothing.js';
import ClothingCategory from '../models/ClothingCategory.js';
import Outfit from '../models/Outfit.js';
import OutfitClothing from '../models/OutfitClothing.js';
import UserPreference from '../models/UserPreference.js';
import sequelize from '../config/database.js';

// 模拟JWT token生成
import { generateToken } from '../middleware/auth.js';

describe('Recommendation Routes', () => {
  let testUser;
  let testToken;
  let testCategory;
  let testClothing;
  let testOutfit;

  // 在所有测试前同步数据库并创建测试数据
  beforeAll(async () => {
    await sequelize.sync({ force: true }); // 重置数据库

    // 创建测试分类
    testCategory = await ClothingCategory.create({
      name: '测试分类',
      order: 1
    });

    // 创建测试用户
    testUser = await User.create({
      email: 'test@example.com',
      password_hash: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // password123
      name: 'Test User',
      phone: '1234567890'
    });

    // 生成测试token
    testToken = generateToken(testUser);

    // 创建用户偏好设置
    await UserPreference.create({
      userId: testUser.id,
      stylePreference: '休闲',
      seasonPreference: '春季',
      brandPreference: '品牌A',
      colorPreference: '蓝色'
    });

    // 创建测试衣物
    testClothing = await Clothing.create({
      userId: testUser.id,
      name: '测试衣物',
      categoryId: testCategory.id,
      style: '休闲',
      season: '春季',
      color: '蓝色',
      brand: '品牌A'
    });

    // 创建测试穿搭
    testOutfit = await Outfit.create({
      userId: testUser.id,
      name: '测试穿搭',
      description: '测试穿搭描述',
      style: '休闲',
      occasion: '日常',
      season: '春季'
    });

    // 添加衣物到穿搭
    await OutfitClothing.create({
      outfitId: testOutfit.id,
      clothingId: testClothing.id
    });
  });

  // 测试获取衣物推荐
  describe('GET /api/recommendations/clothing', () => {
    it('should get clothing recommendations for authenticated user', async () => {
      const response = await request(app)
        .get('/api/recommendations/clothing')
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('clothing');
      expect(Array.isArray(response.body.clothing)).toBe(true);
    });

    it('should get clothing recommendations with filters', async () => {
      const response = await request(app)
        .get(`/api/recommendations/clothing?season=${encodeURIComponent('春季')}&style=${encodeURIComponent('休闲')}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('clothing');
      expect(Array.isArray(response.body.clothing)).toBe(true);
    });

    it('should not get clothing recommendations without authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations/clothing')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });
  });

  // 测试获取穿搭推荐
  describe('GET /api/recommendations/outfits', () => {
    it('should get outfit recommendations for authenticated user', async () => {
      const response = await request(app)
        .get('/api/recommendations/outfits')
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('outfits');
      expect(Array.isArray(response.body.outfits)).toBe(true);
    });

    it('should get outfit recommendations with filters', async () => {
      const response = await request(app)
        .get(`/api/recommendations/outfits?occasion=${encodeURIComponent('日常')}&season=${encodeURIComponent('春季')}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('outfits');
      expect(Array.isArray(response.body.outfits)).toBe(true);
    });

    it('should not get outfit recommendations without authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations/outfits')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });
  });

  // 测试根据自然语言描述获取推荐
  describe('POST /api/recommendations/natural-language', () => {
    it('should get recommendations from natural language description', async () => {
      const response = await request(app)
        .post('/api/recommendations/natural-language')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          description: '我需要一套春季的休闲日常穿搭',
          type: 'outfit' // outfit 或 clothing
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    it('should not get recommendations from natural language without authentication', async () => {
      const response = await request(app)
        .post('/api/recommendations/natural-language')
        .send({
          description: '我需要一套春季的休闲日常穿搭',
          type: 'outfit'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });
  });

  // 测试获取与特定衣物搭配的推荐
  describe('GET /api/recommendations/clothing/:id/match', () => {
    it('should get matching clothing recommendations', async () => {
      const response = await request(app)
        .get(`/api/recommendations/clothing/${testClothing.id}/match`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    it('should not get matching clothing recommendations without authentication', async () => {
      const response = await request(app)
        .get(`/api/recommendations/clothing/${testClothing.id}/match`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });
  });
});