# Cypress E2E 测试环境配置指南

## 概述
本文档描述如何为前后端分离项目配置 Cypress E2E 测试环境，实现自动启动服务、初始化测试数据、运行测试的完整流程。

## 适用场景
- 前后端分离项目（如 React + Express）
- 需要自动化启动前后端服务
- 需要在测试前初始化测试数据
- 使用 Cypress 进行 E2E 测试

---

## 1. 依赖安装

```bash
cd client
npm install -D cypress start-server-and-test concurrently wait-on
```

### 依赖说明
| 依赖 | 作用 |
|------|------|
| `cypress` | E2E 测试框架 |
| `start-server-and-test` | 启动服务后运行测试 |
| `concurrently` | 并行运行多个命令 |
| `wait-on` | 等待服务就绪 |

---

## 2. 测试脚本配置 (`client/package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "start:server": "cd ../server && npm run seed && npm run dev",
    "start:all": "concurrently \"npm run dev\" \"npm run start:server\"",
    "cypress:run": "cypress run --e2e",
    "cypress:open": "cypress open --e2e",
    "test:e2e": "start-server-and-test start:all \"http://localhost:3000|http://localhost:5001/api/health\" cypress:run",
    "test:e2e:open": "start-server-and-test start:all \"http://localhost:3000|http://localhost:5001/api/health\" cypress:open"
  }
}
```

### 脚本说明
| 脚本 | 作用 |
|------|------|
| `start:server` | 初始化数据并启动后端服务 |
| `start:all` | 并行启动前后端服务 |
| `cypress:run` | 无头模式运行 Cypress |
| `cypress:open` | 交互模式打开 Cypress |
| `test:e2e` | 一键运行 E2E 测试 |
| `test:e2e:open` | 交互式运行 E2E 测试 |

---

## 3. Cypress 配置 (`cypress.config.js`)

```javascript
export default {
  e2e: {
    setupNodeEvents(on, config) {
      // 可在此添加自定义事件监听
    },
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    retries: {
      runMode: 2,
      openMode: 0
    },
  },
  viewportWidth: 1280,
  viewportHeight: 720,
};
```

---

## 4. 测试数据初始化 (`server/scripts/seedData.js`)

```javascript
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import User from '../models/User.js';

async function seedDatabase() {
  try {
    console.log('🌱 开始初始化数据库...');
    await sequelize.sync();
    console.log('✅ 数据库同步完成');
    
    // 创建测试用户
    const testUserEmail = 'test@example.com';
    const existingTestUser = await User.findOne({ 
      where: { email: testUserEmail } 
    });
    
    if (!existingTestUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: testUserEmail,
        password_hash: hashedPassword,
        name: '测试用户',
        phone: '1234567890'
      });
      console.log(`✅ 成功创建测试用户 ${testUserEmail}`);
    } else {
      console.log(`ℹ️  测试用户 ${testUserEmail} 已存在`);
    }
    
    console.log('🎉 数据初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
    process.exit(1);
  }
}

seedDatabase();
```

---

## 5. Cypress 自定义命令 (`cypress/support/commands.js`)

```javascript
// 登录命令
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('#login_email').should('be.visible');
  cy.get('#login_email').type(email);
  cy.get('#login_password').type(password);
  cy.get('button').contains('登录').click();
  cy.url().should('eq', Cypress.config().baseUrl + '/');
});

// 注册命令
Cypress.Commands.add('register', (email, password, name, phone) => {
  cy.visit('/register');
  cy.get('#register_email').should('be.visible');
  cy.get('#register_name').type(name);
  cy.get('#register_email').type(email);
  cy.get('#register_phone').type(phone);
  cy.get('#register_password').type(password);
  cy.get('#register_confirmPassword').type(password);
  cy.get('button').contains('注册').click();
  cy.url().should('include', '/login');
});

// 登出命令
Cypress.Commands.add('logout', () => {
  cy.get('button').contains('登出').click();
  cy.url().should('include', '/login');
});
```

---

## 6. 测试文件模板

```javascript
describe('功能测试', () => {
  // 在每个测试前登录
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
  });

  // 在每个测试后登出（避免级联失败）
  afterEach(function() {
    if (this.currentTest.state !== 'failed') {
      cy.logout();
    }
  });

  it('应该能够查看页面', () => {
    cy.visit('/page');
    cy.contains('页面标题').should('be.visible');
  });
});
```

---

## 7. 常见问题解决

### 问题1: 服务未启动就运行测试
**原因**: start-server-and-test 未正确等待服务  
**解决**: 
1. 使用 `|` 分隔多个 URL，等待所有服务就绪
2. 后端添加 `/api/health` 健康检查端点

```javascript
// server/index.js
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});
```

### 问题2: afterEach 级联失败
**原因**: 测试失败后 afterEach 中的操作也会失败  
**解决**: 使用 `this.currentTest.state` 检查测试状态

```javascript
afterEach(function() {
  if (this.currentTest.state !== 'failed') {
    cy.logout();
  }
});
```

### 问题3: 元素选择器不稳定
**原因**: 使用不稳定的选择器（如类名、文本）  
**解决**: 
1. 为关键元素添加 `id` 属性
2. 使用 `data-testid` 属性
3. 使用 `cy.contains()` 匹配文本

### 问题4: 测试数据不存在
**原因**: 未初始化测试数据  
**解决**: 在 `start:server` 脚本中添加 `npm run seed`

---

## 8. 最佳实践

1. **自动化服务启动**: 使用 `start-server-and-test` 管理服务生命周期
2. **数据初始化**: 测试前自动运行 seed 脚本
3. **稳定选择器**: 使用 `id` 或 `data-testid` 属性
4. **防止级联失败**: 在 afterEach 中检查测试状态
5. **合理超时**: 配置足够的超时时间
6. **测试隔离**: 每个测试独立，不依赖其他测试的状态
7. **健康检查**: 后端添加健康检查端点用于服务就绪检测
