import request from 'supertest';
import app from '../index.js';
import User from '../models/User.js';
import Clothing from '../models/Clothing.js';
import ClothingCategory from '../models/ClothingCategory.js';
import sequelize from '../config/database.js';

// 模拟JWT token生成
import { generateToken } from '../middleware/auth.js';

describe('Clothing Routes', () => {
  let testUser;
  let testToken;
  let testCategory;

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
  });

  // 在每个测试后清理衣物数据
  afterEach(async () => {
    await Clothing.destroy({ where: {} });
  });

  // 测试获取衣物分类列表
  describe('GET /api/clothing/categories', () => {
    it('should get clothing categories', async () => {
      const response = await request(app)
        .get('/api/clothing/categories')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  // 测试获取衣物列表
  describe('GET /api/clothing', () => {
    it('should get clothing list for authenticated user', async () => {
      // 创建测试衣物
      await Clothing.create({
        userId: testUser.id,
        name: '测试衣物',
        categoryId: testCategory.id
      });

      const response = await request(app)
        .get('/api/clothing')
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('pages');
      expect(response.body).toHaveProperty('currentPage');
      expect(Array.isArray(response.body.clothing)).toBe(true);
      expect(response.body.clothing.length).toBe(1);
    });

    it('should not get clothing list without authentication', async () => {
      const response = await request(app)
        .get('/api/clothing')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });
  });

  // 测试创建衣物
  describe('POST /api/clothing', () => {
    it('should create a new clothing item', async () => {
      const response = await request(app)
        .post('/api/clothing')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: '新衣物',
          categoryId: testCategory.id
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.message).toBe('衣物创建成功');
      expect(response.body.clothing).toHaveProperty('id');
      expect(response.body.clothing.name).toBe('新衣物');
      expect(response.body.clothing.userId).toBe(testUser.id);
    });

    it('should not create clothing without authentication', async () => {
      const response = await request(app)
        .post('/api/clothing')
        .send({
          name: '新衣物',
          categoryId: testCategory.id
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('未提供认证令牌');
    });
  });

  // 测试获取衣物详情
  describe('GET /api/clothing/:id', () => {
    it('should get clothing detail', async () => {
      // 创建测试衣物
      const clothing = await Clothing.create({
        userId: testUser.id,
        name: '测试衣物',
        categoryId: testCategory.id
      });

      const response = await request(app)
        .get(`/api/clothing/${clothing.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.id).toBe(clothing.id);
      expect(response.body.name).toBe('测试衣物');
    });

    it('should return 404 for non-existent clothing', async () => {
      const response = await request(app)
        .get('/api/clothing/non-existent-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.message).toBe('衣物不存在');
    });
  });

  // 测试更新衣物
  describe('PUT /api/clothing/:id', () => {
    it('should update clothing item', async () => {
      // 创建测试衣物
      const clothing = await Clothing.create({
        userId: testUser.id,
        name: '测试衣物',
        categoryId: testCategory.id
      });

      const response = await request(app)
        .put(`/api/clothing/${clothing.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: '更新后的衣物',
          categoryId: testCategory.id
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.message).toBe('衣物更新成功');
      expect(response.body.clothing.name).toBe('更新后的衣物');
    });
  });

  // 测试删除衣物
  describe('DELETE /api/clothing/:id', () => {
    it('should delete clothing item', async () => {
      // 创建测试衣物
      const clothing = await Clothing.create({
        userId: testUser.id,
        name: '测试衣物',
        categoryId: testCategory.id
      });

      const response = await request(app)
        .delete(`/api/clothing/${clothing.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.message).toBe('衣物删除成功');

      // 验证衣物已删除
      const deletedClothing = await Clothing.findByPk(clothing.id);
      expect(deletedClothing).toBeNull();
    });
  });
});