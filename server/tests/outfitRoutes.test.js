import request from 'supertest';
import app from '../index.js';
import User from '../models/User.js';
import Clothing from '../models/Clothing.js';
import ClothingCategory from '../models/ClothingCategory.js';
import Outfit from '../models/Outfit.js';
import OutfitClothing from '../models/OutfitClothing.js';
import sequelize from '../config/database.js';

// 模拟JWT token生成
import { generateToken } from '../middleware/auth.js';

describe('Outfit Routes', () => {
  let testUser;
  let testToken;
  let testCategory;
  let testClothing;

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

    // 创建测试衣物
    testClothing = await Clothing.create({
      userId: testUser.id,
      name: '测试衣物',
      categoryId: testCategory.id
    });
  });

  // 在每个测试后清理穿搭数据
  afterEach(async () => {
    await OutfitClothing.destroy({ where: {} });
    await Outfit.destroy({ where: {} });
  });

  // 测试获取穿搭列表
  describe('GET /api/outfits', () => {
    it('should get outfit list for authenticated user', async () => {
      // 创建测试穿搭
      const outfit = await Outfit.create({
        userId: testUser.id,
        name: '测试穿搭',
        description: '测试穿搭描述',
        style: '休闲',
        occasion: '日常',
        season: '春季'
      });

      // 添加衣物到穿搭
      await OutfitClothing.create({
        outfitId: outfit.id,
        clothingId: testClothing.id
      });

      const response = await request(app)
        .get('/api/outfits')
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('pages');
      expect(response.body).toHaveProperty('currentPage');
      expect(Array.isArray(response.body.outfits)).toBe(true);
      expect(response.body.outfits.length).toBe(1);
    });

    it('should not get outfit list without authentication', async () => {
      const response = await request(app)
        .get('/api/outfits')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });
  });

  // 测试创建穿搭
  describe('POST /api/outfits', () => {
    it('should create a new outfit', async () => {
      const response = await request(app)
        .post('/api/outfits')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: '新穿搭',
          description: '新穿搭描述',
          style: '休闲',
          occasion: '日常',
          season: '春季',
          clothingIds: [testClothing.id]
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.message).toBe('穿搭方案创建成功');
      expect(response.body.outfit).toHaveProperty('id');
      expect(response.body.outfit.name).toBe('新穿搭');
      expect(response.body.outfit.userId).toBe(testUser.id);
    });

    it('should not create outfit without authentication', async () => {
      const response = await request(app)
        .post('/api/outfits')
        .send({
          name: '新穿搭',
          description: '新穿搭描述',
          style: '休闲',
          occasion: '日常',
          season: '春季',
          clothingIds: [testClothing.id]
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });
  });

  // 测试获取穿搭详情
  describe('GET /api/outfits/:id', () => {
    it('should get outfit detail', async () => {
      // 创建测试穿搭
      const outfit = await Outfit.create({
        userId: testUser.id,
        name: '测试穿搭',
        description: '测试穿搭描述',
        style: '休闲',
        occasion: '日常',
        season: '春季'
      });

      // 添加衣物到穿搭
      await OutfitClothing.create({
        outfitId: outfit.id,
        clothingId: testClothing.id
      });

      const response = await request(app)
        .get(`/api/outfits/${outfit.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.id).toBe(outfit.id);
      expect(response.body.name).toBe('测试穿搭');
      expect(Array.isArray(response.body.clothing)).toBe(true);
      expect(response.body.clothing.length).toBe(1);
    });

    it('should return 404 for non-existent outfit', async () => {
      const response = await request(app)
        .get('/api/outfits/non-existent-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.message).toBe('穿搭方案不存在');
    });
  });

  // 测试更新穿搭
  describe('PUT /api/outfits/:id', () => {
    it('should update outfit', async () => {
      // 创建测试穿搭
      const outfit = await Outfit.create({
        userId: testUser.id,
        name: '测试穿搭',
        description: '测试穿搭描述',
        style: '休闲',
        occasion: '日常',
        season: '春季'
      });

      // 添加衣物到穿搭
      await OutfitClothing.create({
        outfitId: outfit.id,
        clothingId: testClothing.id
      });

      const response = await request(app)
        .put(`/api/outfits/${outfit.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: '更新后的穿搭',
          description: '更新后的穿搭描述',
          style: '正式',
          occasion: '工作',
          season: '秋季',
          clothingIds: [testClothing.id]
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.message).toBe('穿搭方案更新成功');
      expect(response.body.outfit.name).toBe('更新后的穿搭');
      // Outfit模型中没有style属性，移除这个断言
      expect(response.body.outfit.occasion).toBe('工作');
      expect(response.body.outfit.season).toBe('秋季');
    });
  });

  // 测试删除穿搭
  describe('DELETE /api/outfits/:id', () => {
    it('should delete outfit', async () => {
      // 创建测试穿搭
      const outfit = await Outfit.create({
        userId: testUser.id,
        name: '测试穿搭',
        description: '测试穿搭描述',
        style: '休闲',
        occasion: '日常',
        season: '春季'
      });

      // 添加衣物到穿搭
      await OutfitClothing.create({
        outfitId: outfit.id,
        clothingId: testClothing.id
      });

      const response = await request(app)
        .delete(`/api/outfits/${outfit.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.message).toBe('穿搭方案删除成功');

      // 验证穿搭已删除
      const deletedOutfit = await Outfit.findByPk(outfit.id);
      expect(deletedOutfit).toBeNull();

      // 验证关联的穿搭衣物已删除
      const outfitClothing = await OutfitClothing.findOne({
        where: { outfitId: outfit.id }
      });
      expect(outfitClothing).toBeNull();
    });
  });

  // 测试添加衣物到穿搭
  describe('POST /api/outfits/:id/clothing', () => {
    it('should add clothing to outfit', async () => {
      // 创建测试穿搭
      const outfit = await Outfit.create({
        userId: testUser.id,
        name: '测试穿搭',
        description: '测试穿搭描述',
        style: '休闲',
        occasion: '日常',
        season: '春季'
      });

      const response = await request(app)
        .post(`/api/outfits/${outfit.id}/clothing`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          clothingId: testClothing.id,
          order: 0
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.message).toBe('衣物添加到穿搭方案成功');
      expect(response.body.outfitClothing).toHaveProperty('outfitId');
      expect(response.body.outfitClothing).toHaveProperty('clothingId');
      expect(response.body.outfitClothing.outfitId).toBe(outfit.id);
      expect(response.body.outfitClothing.clothingId).toBe(testClothing.id);
    });
  });

  // 测试生成分享链接
  describe('POST /api/outfits/:id/share', () => {
    it('should generate share link', async () => {
      // 创建测试穿搭
      const outfit = await Outfit.create({
        userId: testUser.id,
        name: '分享测试穿搭',
        description: '用于测试分享功能',
        occasion: '日常',
        season: '春季'
      });

      const response = await request(app)
        .post(`/api/outfits/${outfit.id}/share`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          expiresInDays: 7
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('shareCode');
      expect(response.body.data).toHaveProperty('shareUrl');
      expect(response.body.data).toHaveProperty('expiresAt');
      expect(response.body.data.shareCode).toHaveLength(16); // 8 bytes = 16 hex chars
    });

    it('should return 404 for non-existent outfit', async () => {
      const response = await request(app)
        .post('/api/outfits/00000000-0000-0000-0000-000000000000/share')
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('穿搭方案不存在');
    });

    it('should not share without authentication', async () => {
      const outfit = await Outfit.create({
        userId: testUser.id,
        name: '分享测试穿搭2',
        description: '用于测试分享功能',
        occasion: '日常',
        season: '春季'
      });

      const response = await request(app)
        .post(`/api/outfits/${outfit.id}/share`)
        .send({})
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });
  });

  // 测试获取分享的穿搭（公开接口）
  describe('GET /api/outfits/shared/:shareCode', () => {
    it('should get shared outfit without authentication', async () => {
      // 创建测试穿搭
      const outfit = await Outfit.create({
        userId: testUser.id,
        name: '公开分享穿搭',
        description: '用于测试公开获取',
        occasion: '约会',
        season: '夏季'
      });

      // 添加衣物到穿搭
      await OutfitClothing.create({
        outfitId: outfit.id,
        clothingId: testClothing.id
      });

      // 先生成分享链接
      const shareResponse = await request(app)
        .post(`/api/outfits/${outfit.id}/share`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ expiresInDays: 7 })
        .expect(200);

      const shareCode = shareResponse.body.data.shareCode;

      // 无需认证获取分享的穿搭
      const response = await request(app)
        .get(`/api/outfits/shared/${shareCode}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('outfit');
      expect(response.body.data).toHaveProperty('sharedBy');
      expect(response.body.data).toHaveProperty('viewCount');
      expect(response.body.data.outfit.name).toBe('公开分享穿搭');
    });

    it('should return 404 for invalid share code', async () => {
      const response = await request(app)
        .get('/api/outfits/shared/invalidcode123456')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('分享链接不存在或已失效');
    });

    it('should increment view count on each access', async () => {
      // 创建测试穿搭
      const outfit = await Outfit.create({
        userId: testUser.id,
        name: '浏览量测试穿搭',
        description: '测试浏览量',
        occasion: '日常',
        season: '春季'
      });

      // 生成分享链接
      const shareResponse = await request(app)
        .post(`/api/outfits/${outfit.id}/share`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ expiresInDays: 7 })
        .expect(200);

      const shareCode = shareResponse.body.data.shareCode;

      // 第一次访问
      const response1 = await request(app)
        .get(`/api/outfits/shared/${shareCode}`)
        .expect(200);

      expect(response1.body.data.viewCount).toBe(1);

      // 第二次访问
      const response2 = await request(app)
        .get(`/api/outfits/shared/${shareCode}`)
        .expect(200);

      expect(response2.body.data.viewCount).toBe(2);
    });
  });

  // 测试删除分享链接
  describe('DELETE /api/outfits/share/:shareCode', () => {
    it('should delete share link', async () => {
      // 创建测试穿搭
      const outfit = await Outfit.create({
        userId: testUser.id,
        name: '删除分享测试',
        description: '测试删除分享',
        occasion: '日常',
        season: '春季'
      });

      // 生成分享链接
      const shareResponse = await request(app)
        .post(`/api/outfits/${outfit.id}/share`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ expiresInDays: 7 })
        .expect(200);

      const shareCode = shareResponse.body.data.shareCode;

      // 删除分享链接
      const response = await request(app)
        .delete(`/api/outfits/share/${shareCode}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toBe('分享链接已删除');

      // 验证分享链接已失效
      const getResponse = await request(app)
        .get(`/api/outfits/shared/${shareCode}`)
        .expect(404);

      expect(getResponse.body.message).toBe('分享链接不存在或已失效');
    });

    it('should return 404 for non-existent share code', async () => {
      const response = await request(app)
        .delete('/api/outfits/share/nonexistentcode1')
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('分享链接不存在');
    });

    it('should not delete without authentication', async () => {
      const response = await request(app)
        .delete('/api/outfits/share/anycode12345678')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });
  });
});