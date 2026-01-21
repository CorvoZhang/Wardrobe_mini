# Node.js + Jest + SQLite 测试环境配置指南

## 概述
本文档描述如何为 Node.js + Express + Sequelize + SQLite 项目配置 Jest 测试环境，解决 SQLite 并发锁定问题（SQLITE_BUSY）。

## 适用场景
- Node.js + Express 后端项目
- 使用 Sequelize ORM
- 使用 SQLite 数据库
- 需要并行/串行运行多个测试文件
- 遇到 SQLITE_BUSY 错误

---

## 1. 问题分析

### 1.1 SQLITE_BUSY 错误原因
- 多个测试文件同时运行时，都尝试访问同一个 SQLite 文件
- SQLite 不支持高并发写入
- 每个测试文件的 `beforeAll` 中执行 `sequelize.sync({ force: true })` 导致冲突

### 1.2 解决方案
- 测试环境使用内存数据库 (`:memory:`)
- 每个测试进程获得独立的数据库实例
- 使用 `--runInBand` 串行执行测试

---

## 2. 数据库配置 (`config/database.js`)

```javascript
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV;

let sequelize;

if (DATABASE_URL && NODE_ENV !== 'test') {
  // 生产环境: 使用 PostgreSQL
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
} else if (NODE_ENV === 'test') {
  // 测试环境: 使用 SQLite 内存数据库
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',  // 关键：使用内存数据库
    logging: false,
    dialectOptions: { foreignKeys: true }
  });
} else {
  // 开发环境: 使用 SQLite 文件数据库
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: NODE_ENV === 'development' ? console.log : false,
    dialectOptions: { foreignKeys: true }
  });
}

export default sequelize;
```

---

## 3. Jest 配置 (`package.json`)

```json
{
  "scripts": {
    "test": "NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --forceExit"
  },
  "jest": {
    "transform": {},
    "testEnvironment": "node",
    "testTimeout": 30000,
    "setupFilesAfterEnv": ["./tests/setup.js"],
    "verbose": true
  }
}
```

### 关键参数说明
| 参数 | 作用 |
|------|------|
| `NODE_ENV=test` | 触发使用内存数据库 |
| `--experimental-vm-modules` | 支持 ES 模块 |
| `--runInBand` | 串行执行测试，避免并发问题 |
| `--forceExit` | 测试完成后强制退出 |
| `testTimeout: 30000` | 增加超时时间，适应数据库操作 |

---

## 4. 测试设置文件 (`tests/setup.js`)

```javascript
// Jest 测试环境设置文件
import sequelize from '../config/database.js';

// 在所有测试完成后关闭数据库连接
afterAll(async () => {
  try {
    await sequelize.close();
  } catch (error) {
    // 忽略关闭连接时的错误
  }
});
```

---

## 5. 测试文件模板

```javascript
import request from 'supertest';
import app from '../index.js';
import User from '../models/User.js';
import sequelize from '../config/database.js';

describe('User Routes', () => {
  // 在所有测试前同步数据库（内存数据库每次都是空的）
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  // 在每个测试后清理数据
  afterEach(async () => {
    await User.destroy({ where: {} });
  });

  it('should create a user', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      .expect(201);

    expect(response.body.user).toHaveProperty('id');
  });
});
```

---

## 6. 常见问题解决

### 问题1: SQLITE_BUSY 错误
**原因**: 多个测试文件并发访问同一数据库文件  
**解决**: 
1. 设置 `NODE_ENV=test` 使用内存数据库
2. 添加 `--runInBand` 串行执行

### 问题2: 测试完成后进程不退出
**原因**: 数据库连接未关闭  
**解决**: 
1. 在 `tests/setup.js` 中添加 `afterAll` 关闭连接
2. 使用 `--forceExit` 参数

### 问题3: 测试超时
**原因**: 数据库操作耗时较长  
**解决**: 增加 `testTimeout` 配置

### 问题4: 模型关联错误
**原因**: 模型关联在内存数据库中未正确建立  
**解决**: 确保在 `beforeAll` 中使用 `sequelize.sync({ force: true })`

---

## 7. 最佳实践

1. **分离测试数据库**: 测试环境始终使用内存数据库
2. **串行执行**: 使用 `--runInBand` 避免并发问题
3. **清理数据**: 每个测试后清理相关数据，保持测试隔离
4. **关闭连接**: 测试结束后关闭数据库连接
5. **独立导出 app**: 服务器文件应导出 app 实例，而非直接启动监听
