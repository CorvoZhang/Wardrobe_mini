# Sequelize 多环境数据库配置

## 概述

在实际项目中，开发、测试和生产环境通常需要使用不同的数据库配置。本文档总结了如何使用 Sequelize 实现多环境数据库配置的最佳实践。

## 适用场景

- 开发环境使用 SQLite 简化配置
- 测试环境使用 SQLite 内存数据库提高速度
- 生产环境使用 PostgreSQL/MySQL 保证性能和可靠性
- 不同环境需要不同的连接池配置

## 核心实现

### 1. 安装依赖

```bash
# 核心依赖
npm install sequelize dotenv

# 数据库驱动（按需安装）
npm install pg pg-hstore     # PostgreSQL
npm install mysql2           # MySQL
npm install sqlite3          # SQLite
```

### 2. 多环境配置

```javascript
// config/database.js
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取环境变量
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

let sequelize;

// ==================== 生产环境: PostgreSQL ====================
if (DATABASE_URL && NODE_ENV === 'production') {
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,  // 生产环境关闭日志
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false  // Heroku/Railway 等平台需要
      }
    },
    pool: {
      max: 10,        // 最大连接数
      min: 2,         // 最小连接数
      acquire: 30000, // 获取连接超时时间
      idle: 10000     // 连接空闲超时时间
    }
  });
}
// ==================== 测试环境: SQLite 内存数据库 ====================
else if (NODE_ENV === 'test') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',  // 内存数据库，每次测试后自动清空
    logging: false,       // 测试时关闭日志
    dialectOptions: {
      foreignKeys: true   // 启用外键约束
    }
  });
}
// ==================== 开发环境: SQLite 文件数据库 ====================
else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      foreignKeys: true
    }
  });

  // SQLite 启用外键约束
  sequelize.query('PRAGMA foreign_keys = ON;').catch(() => {});
}

export default sequelize;
```

### 3. 环境变量配置

```bash
# .env.development
NODE_ENV=development
# SQLite 不需要额外配置

# .env.test
NODE_ENV=test
# 使用内存数据库，不需要 DATABASE_URL

# .env.production
NODE_ENV=production
DATABASE_URL=postgres://user:password@host:5432/database
```

### 4. 模型定义

```javascript
// models/User.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,  // 自动添加 createdAt 和 updatedAt
  underscored: true  // 使用下划线命名（created_at 而不是 createdAt）
});

export default User;
```

### 5. 模型关联

```javascript
// models/index.js
import sequelize from '../config/database.js';
import User from './User.js';
import Clothing from './Clothing.js';
import ClothingImage from './ClothingImage.js';
import Outfit from './Outfit.js';
import OutfitClothing from './OutfitClothing.js';

// 定义关联关系
User.hasMany(Clothing, { foreignKey: 'userId', as: 'clothing' });
Clothing.belongsTo(User, { foreignKey: 'userId' });

Clothing.hasMany(ClothingImage, { foreignKey: 'clothingId', as: 'images' });
ClothingImage.belongsTo(Clothing, { foreignKey: 'clothingId' });

User.hasMany(Outfit, { foreignKey: 'userId', as: 'outfits' });
Outfit.belongsTo(User, { foreignKey: 'userId' });

// 多对多关联
Outfit.belongsToMany(Clothing, { 
  through: OutfitClothing,
  foreignKey: 'outfitId',
  as: 'clothing'
});
Clothing.belongsToMany(Outfit, { 
  through: OutfitClothing,
  foreignKey: 'clothingId',
  as: 'outfits'
});

export {
  sequelize,
  User,
  Clothing,
  ClothingImage,
  Outfit,
  OutfitClothing
};
```

### 6. 数据库初始化

```javascript
// index.js
import express from 'express';
import sequelize from './config/database.js';

const app = express();

// 数据库同步函数
async function syncDatabase() {
  try {
    // 开发环境：alter 模式（自动调整表结构）
    // 生产环境：应使用迁移而不是 sync
    const syncOptions = process.env.NODE_ENV === 'production' 
      ? {} 
      : { alter: true };
    
    await sequelize.sync(syncOptions);
    console.log('数据库同步成功');
  } catch (error) {
    console.error('数据库同步失败:', error);
    process.exit(1);
  }
}

// 启动服务器
const PORT = process.env.PORT || 5001;

syncDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
});

export default app;
```

## 测试环境配置

### Jest 测试设置

```javascript
// tests/setup.js
import sequelize from '../config/database.js';
import '../models/index.js';  // 导入模型以注册关联

// 在所有测试前同步数据库
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

// 每个测试后清理数据
afterEach(async () => {
  // 获取所有表
  const models = Object.values(sequelize.models);
  
  // 按依赖顺序清理（先清理有外键依赖的表）
  for (const model of models) {
    await model.destroy({ where: {}, truncate: true, cascade: true });
  }
});

// 所有测试完成后关闭连接
afterAll(async () => {
  await sequelize.close();
});
```

### Jest 配置

```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  // 串行执行测试，避免数据库并发问题
  maxWorkers: 1
};
```

### 运行测试的 package.json 脚本

```json
{
  "scripts": {
    "test": "NODE_ENV=test jest --runInBand --detectOpenHandles",
    "test:watch": "NODE_ENV=test jest --runInBand --watch",
    "test:coverage": "NODE_ENV=test jest --runInBand --coverage"
  }
}
```

## 高级配置

### 1. 读写分离

```javascript
const sequelize = new Sequelize({
  dialect: 'postgres',
  replication: {
    read: [
      { host: 'read-replica-1.example.com', username: 'user', password: 'pass' },
      { host: 'read-replica-2.example.com', username: 'user', password: 'pass' }
    ],
    write: { 
      host: 'master.example.com', 
      username: 'user', 
      password: 'pass' 
    }
  },
  pool: {
    max: 20,
    min: 5,
    idle: 10000
  }
});
```

### 2. 连接重试

```javascript
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  retry: {
    max: 5,
    timeout: 30000,
    match: [
      /ETIMEDOUT/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ESOCKETTIMEDOUT/,
      /EHOSTUNREACH/,
      /EPIPE/,
      /EAI_AGAIN/
    ]
  }
});
```

### 3. 日志配置

```javascript
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: (msg, timing) => {
    if (timing > 1000) {
      // 记录慢查询
      console.warn(`慢查询 (${timing}ms): ${msg}`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(msg);
    }
  },
  benchmark: true  // 启用查询计时
});
```

### 4. 健康检查

```javascript
// routes/health.js
import sequelize from '../config/database.js';

router.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});
```

## 数据库迁移（生产环境推荐）

### 安装 Sequelize CLI

```bash
npm install --save-dev sequelize-cli
```

### 初始化迁移目录

```bash
npx sequelize-cli init
```

### 创建迁移文件

```bash
npx sequelize-cli migration:generate --name create-users
```

### 迁移文件示例

```javascript
// migrations/20260120000001-create-users.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
```

### 运行迁移

```bash
# 运行所有待执行的迁移
npx sequelize-cli db:migrate

# 回滚最近一次迁移
npx sequelize-cli db:migrate:undo

# 回滚所有迁移
npx sequelize-cli db:migrate:undo:all
```

## 常见问题

### Q: SQLite 和 PostgreSQL 的语法差异？

| 特性 | SQLite | PostgreSQL |
|------|--------|------------|
| 自增主键 | `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` |
| 布尔类型 | 0/1 | true/false |
| JSON 类型 | TEXT | JSONB |
| 日期函数 | `datetime('now')` | `NOW()` |

Sequelize 会自动处理大部分差异，但复杂查询可能需要注意。

### Q: 测试时出现 SQLITE_BUSY 错误？

```bash
# 确保使用串行执行
npm test -- --runInBand
```

### Q: 如何在生产环境安全地修改表结构？

1. 使用迁移而不是 `sync({ alter: true })`
2. 在低峰期执行迁移
3. 先在预发布环境测试迁移脚本
4. 准备回滚方案

---

## 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2026-01-20 | 初始化文档 |
