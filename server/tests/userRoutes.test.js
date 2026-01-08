import request from 'supertest';
import app from '../index.js';
import User from '../models/User.js';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

describe('User Routes', () => {
  // 在所有测试前同步数据库
  beforeAll(async () => {
    await sequelize.sync({ force: true }); // 重置数据库
  });

  // 在每个测试后清理数据
  afterEach(async () => {
    await User.destroy({ where: {} });
  });

  // 测试用户注册
  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          phone: '1234567890'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.message).toBe('注册成功');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.phone).toBe('1234567890');
      expect(response.body).toHaveProperty('token');
    });

    it('should not register a user with existing email', async () => {
      // 先注册一个用户
      await User.create({
        email: 'existing@example.com',
        password_hash: 'hashedpassword',
        name: 'Existing User',
        phone: '0987654321'
      });

      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Test User',
          phone: '1234567890'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.message).toBe('该邮箱已被注册');
    });
  });

  // 测试用户登录
  describe('POST /api/users/login', () => {
    it('should login an existing user', async () => {
      // 先注册一个用户，使用bcrypt生成正确的密码哈希
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'login@example.com',
        password_hash: hashedPassword,
        name: 'Login User',
        phone: '1234567890'
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.message).toBe('登录成功');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.body).toHaveProperty('token');
    });

    it('should not login with wrong password', async () => {
      // 先注册一个用户，使用bcrypt生成正确的密码哈希
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'wrong@example.com',
        password_hash: hashedPassword,
        name: 'Wrong Password User',
        phone: '1234567890'
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('邮箱或密码错误');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.message).toBe('邮箱或密码错误');
    });
  });
});