# 技能文档索引

本目录包含项目开发过程中沉淀的标准化流程和最佳实践。

---

## 📚 文档列表

### 前端开发

| 文档 | 描述 | 适用场景 |
|------|------|----------|
| [react-context-state-management.md](./react-context-state-management.md) | React Context 全局状态管理 | 认证状态、主题切换等全局状态 |
| [axios-interceptor-setup.md](./axios-interceptor-setup.md) | Axios 请求拦截器配置 | HTTP 请求统一处理、Token 注入 |
| [css-variables-theme-system.md](./css-variables-theme-system.md) | CSS 变量主题系统 | 深色/浅色模式、多主题切换 |

### 前端测试

| 文档 | 描述 | 适用场景 |
|------|------|----------|
| [react-jest-testing-setup.md](./react-jest-testing-setup.md) | React + Jest 测试环境配置 | 初始化项目测试环境 |
| [react-form-component-testing.md](./react-form-component-testing.md) | React 表单组件测试模式 | 登录/注册等表单测试 |
| [vite-jest-compatibility.md](./vite-jest-compatibility.md) | Vite + Jest 兼容性处理 | 解决 import.meta 等问题 |
| [antd-component-testing.md](./antd-component-testing.md) | Ant Design 组件测试 | Ant Design UI 测试 |

### 后端开发

| 文档 | 描述 | 适用场景 |
|------|------|----------|
| [express-jwt-auth-middleware.md](./express-jwt-auth-middleware.md) | Express JWT 认证中间件 | API 认证、用户登录注册 |
| [multer-file-upload-setup.md](./multer-file-upload-setup.md) | Multer 文件上传配置 | 图片上传、文件处理 |
| [sequelize-multi-env-database.md](./sequelize-multi-env-database.md) | Sequelize 多环境数据库配置 | 开发/测试/生产环境数据库切换 |

### 后端测试

| 文档 | 描述 | 适用场景 |
|------|------|----------|
| [node-jest-sqlite-testing.md](./node-jest-sqlite-testing.md) | Node.js + Jest + SQLite 测试配置 | 解决 SQLITE_BUSY 并发问题 |

### E2E 测试

| 文档 | 描述 | 适用场景 |
|------|------|----------|
| [cypress-e2e-testing-setup.md](./cypress-e2e-testing-setup.md) | Cypress E2E 测试环境配置 | 自动化启动服务运行 E2E 测试 |

### AI 集成

| 文档 | 描述 | 适用场景 |
|------|------|----------|
| [volcengine-ai-integration.md](./volcengine-ai-integration.md) | 火山引擎 Ark AI 服务集成 | 图片生成、虚拟试穿等 AI 功能（国内推荐） |
| [replicate-ai-integration.md](./replicate-ai-integration.md) | Replicate AI 服务集成 | 虚拟试穿 IDM-VTON 等国际模型 |

---

## 🚀 快速开始

### 前端开发配置

1. 阅读 [react-context-state-management.md](./react-context-state-management.md) 实现全局状态管理
2. 阅读 [axios-interceptor-setup.md](./axios-interceptor-setup.md) 配置 HTTP 请求拦截器
3. 阅读 [css-variables-theme-system.md](./css-variables-theme-system.md) 实现主题切换功能

### 后端开发配置

1. 阅读 [express-jwt-auth-middleware.md](./express-jwt-auth-middleware.md) 实现 JWT 认证
2. 阅读 [multer-file-upload-setup.md](./multer-file-upload-setup.md) 配置文件上传功能
3. 阅读 [sequelize-multi-env-database.md](./sequelize-multi-env-database.md) 配置多环境数据库

### 前端单元测试配置

1. 阅读 [react-jest-testing-setup.md](./react-jest-testing-setup.md) 配置基础环境
2. 如果使用 Vite，阅读 [vite-jest-compatibility.md](./vite-jest-compatibility.md) 处理兼容性
3. 如果使用 Ant Design，阅读 [antd-component-testing.md](./antd-component-testing.md) 添加必要 mock

### 后端单元测试配置

1. 阅读 [node-jest-sqlite-testing.md](./node-jest-sqlite-testing.md) 配置 SQLite 内存数据库
2. 配置 `NODE_ENV=test` 和 `--runInBand` 参数

### E2E 测试配置

1. 阅读 [cypress-e2e-testing-setup.md](./cypress-e2e-testing-setup.md) 配置自动化测试环境
2. 安装 `start-server-and-test` 等依赖
3. 配置测试数据初始化脚本

### AI 功能集成

#### 方案一：火山引擎 Ark（国内推荐）
1. 阅读 [volcengine-ai-integration.md](./volcengine-ai-integration.md) 了解集成模式
2. 在 [火山引擎控制台](https://console.volcengine.com/ark) 获取 API Key
3. 配置 `ARK_API_KEY` 环境变量（可选，支持 Mock 模式）
4. 使用 Doubao-Seedream 模型进行图片生成

#### 方案二：Replicate（国际模型）
1. 阅读 [replicate-ai-integration.md](./replicate-ai-integration.md) 了解集成模式
2. 安装 `replicate` SDK
3. 配置 `REPLICATE_API_TOKEN` 环境变量
4. 使用 IDM-VTON 等专业虚拟试穿模型

### 编写表单测试

1. 阅读 [react-form-component-testing.md](./react-form-component-testing.md) 了解测试模式
2. 复制模板代码，根据实际组件调整

---

## 📋 技能清单

### 前端开发
- [x] React Context 全局状态管理
- [x] 自定义 Hook 封装 (useAuth, useTheme)
- [x] localStorage 状态持久化
- [x] Axios 请求/响应拦截器
- [x] 统一错误处理
- [x] 401 自动跳转登录
- [x] CSS 变量主题系统
- [x] 深色/浅色模式切换
- [x] 主题过渡动画

### 后端开发
- [x] JWT Token 生成与验证
- [x] 认证中间件实现
- [x] 角色权限控制 (RBAC)
- [x] Multer 文件上传配置
- [x] 文件类型双重验证
- [x] UUID 唯一文件名
- [x] Sequelize 多环境数据库
- [x] PostgreSQL 生产环境配置
- [x] SQLite 开发/测试环境配置

### 前端 Jest 配置
- [x] ES 模块转换配置
- [x] CSS/静态资源 mock
- [x] 测试超时配置
- [x] 测试文件匹配规则

### 测试环境 Mock
- [x] window.matchMedia
- [x] ResizeObserver
- [x] IntersectionObserver
- [x] localStorage/sessionStorage
- [x] requestAnimationFrame

### Ant Design 测试
- [x] message API mock
- [x] notification API mock
- [x] Modal.confirm mock
- [x] Form 异步验证处理

### React 测试模式
- [x] Provider 包装辅助函数
- [x] 异步操作处理 (act/waitFor)
- [x] userEvent 用户交互模拟
- [x] 元素查询最佳实践

### 后端 Jest 配置
- [x] SQLite 内存数据库配置
- [x] 测试环境变量设置
- [x] 串行执行配置 (--runInBand)
- [x] 数据库连接关闭处理

### Cypress E2E 测试
- [x] 自动启动服务配置
- [x] 测试数据初始化
- [x] 自定义命令 (login/logout)
- [x] 级联失败防护

### AI 集成
- [x] 火山引擎 Ark API 集成（国内推荐）
- [x] Doubao-Seedream 图片生成模型
- [x] Replicate SDK 集成（国际模型）
- [x] Mock 模式支持（无 API Key 开发）
- [x] AI 生成历史记录存储
- [x] 服务状态检查 API
- [x] 前端加载状态管理
- [x] 虚拟试穿模型调用 (IDM-VTON)

---

## 🔧 维护说明

- 遇到新的标准化流程时，创建新的技能文档
- 文档命名使用小写字母和连字符，如 `new-skill-name.md`
- 每个文档应包含：概述、适用场景、详细步骤、常见问题
- 更新此 README 索引文件

---

## 📅 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2026-01-14 | 初始化技能文档，添加 Jest 测试相关文档 |
| 2026-01-14 | 添加后端 SQLite 测试配置文档 (node-jest-sqlite-testing.md) |
| 2026-01-14 | 添加 Cypress E2E 测试配置文档 (cypress-e2e-testing-setup.md) |
| 2026-01-14 | 添加 Replicate AI 服务集成文档 (replicate-ai-integration.md) |
| 2026-01-14 | 添加火山引擎 Ark AI 服务集成文档 (volcengine-ai-integration.md) |
| 2026-01-14 | 将默认 AI 服务从 Replicate 切换为火山引擎 Doubao-Seedream |
| 2026-01-20 | 添加 React Context 状态管理文档 (react-context-state-management.md) |
| 2026-01-20 | 添加 Axios 拦截器配置文档 (axios-interceptor-setup.md) |
| 2026-01-20 | 添加 Express JWT 认证中间件文档 (express-jwt-auth-middleware.md) |
| 2026-01-20 | 添加 Multer 文件上传配置文档 (multer-file-upload-setup.md) |
| 2026-01-20 | 添加 Sequelize 多环境数据库配置文档 (sequelize-multi-env-database.md) |
| 2026-01-20 | 添加 CSS 变量主题系统文档 (css-variables-theme-system.md) |