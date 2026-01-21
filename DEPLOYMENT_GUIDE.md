# 智能穿搭规划系统 - 部署指南

本文档详细说明如何将项目部署到 Supabase + Railway + Vercel 架构。

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase (托管)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ PostgreSQL  │  │   Storage   │  │    Auth     │              │
│  │   数据库    │  │  图片存储    │  │  用户认证   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    后端 API 服务 (Railway)                       │
│            Express + Sequelize + AI 服务                         │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    前端 React 应用 (Vercel)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 第一步：配置 Supabase

### 1.1 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 并注册/登录
2. 点击 "New Project" 创建新项目
3. 填写项目名称，选择区域（建议选择离用户近的区域）
4. 设置数据库密码（**请妥善保存**）
5. 等待项目创建完成（约 2 分钟）

### 1.2 获取连接凭证

在 Supabase Dashboard 中：

1. **Project URL**：Settings → API → Project URL
   ```
   https://[YOUR-PROJECT-REF].supabase.co
   ```

2. **Anon Key**：Settings → API → anon public
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Service Role Key**：Settings → API → service_role（⚠️ 不要泄露此密钥）
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Database URL**：Settings → Database → Connection string → URI
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

### 1.3 创建 Storage Buckets

在 Supabase Dashboard → Storage：

1. 点击 "New Bucket"
2. 创建以下 3 个存储桶：

| Bucket 名称 | 公开访问 | 用途 |
|------------|---------|------|
| `clothing-images` | ✅ Public | 衣物图片 |
| `outfit-images` | ✅ Public | 穿搭效果图 |
| `try-on-results` | ✅ Public | 试穿结果图 |

### 1.4 配置 Storage 策略

对于每个 Bucket，添加以下 RLS 策略：

**允许认证用户上传（INSERT）**：
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'clothing-images');
```

**允许公开读取（SELECT）**：
```sql
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'clothing-images');
```

---

## 第二步：部署后端到 Railway

### 2.1 准备工作

1. 访问 [railway.app](https://railway.app) 并注册/登录
2. 连接你的 GitHub 账户

### 2.2 创建新项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你的仓库 `Wardrobe_mini`
4. Railway 会自动检测到 `server` 目录

### 2.3 配置环境变量

在 Railway 项目的 Variables 页面，添加以下环境变量：

```bash
# 环境标识
NODE_ENV=production

# 数据库 (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase Storage
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_KEY=[YOUR-SERVICE-ROLE-KEY]

# JWT 认证 (使用强密钥)
JWT_SECRET=[生成一个强密钥: openssl rand -base64 32]

# AI 服务 (可选)
ARK_API_KEY=[火山引擎 API Key]
REPLICATE_API_TOKEN=[Replicate API Token]
```

### 2.4 配置部署设置

在 Settings 页面：

1. **Root Directory**: `server`
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`

### 2.5 获取后端 URL

部署成功后，Railway 会提供一个 URL：
```
https://[YOUR-APP-NAME].railway.app
```

---

## 第三步：部署前端到 Vercel

### 3.1 准备工作

1. 访问 [vercel.com](https://vercel.com) 并注册/登录
2. 连接你的 GitHub 账户

### 3.2 创建新项目

1. 点击 "Add New" → "Project"
2. 选择你的仓库 `Wardrobe_mini`
3. 配置项目：
   - **Framework Preset**: Vite
   - **Root Directory**: `client`

### 3.3 配置环境变量

在 Vercel 项目的 Settings → Environment Variables：

```bash
VITE_API_URL=https://[YOUR-RAILWAY-APP].railway.app/api
```

### 3.4 部署

点击 "Deploy"，Vercel 会自动构建和部署前端应用。

---

## 环境变量完整清单

### 后端 (Railway)

| 变量名 | 必填 | 说明 |
|--------|-----|------|
| `NODE_ENV` | ✅ | 设置为 `production` |
| `DATABASE_URL` | ✅ | Supabase PostgreSQL 连接字符串 |
| `SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase Service Role Key |
| `JWT_SECRET` | ✅ | JWT 签名密钥（至少 32 字符） |
| `ARK_API_KEY` | ❌ | 火山引擎 API Key（AI 功能） |
| `REPLICATE_API_TOKEN` | ❌ | Replicate API Token（背景去除） |
| `PORT` | ❌ | Railway 自动配置 |

### 前端 (Vercel)

| 变量名 | 必填 | 说明 |
|--------|-----|------|
| `VITE_API_URL` | ✅ | 后端 API 地址 |

---

## 验证部署

### 检查后端

访问以下端点验证后端是否正常运行：

1. **健康检查**：`https://[YOUR-RAILWAY-APP].railway.app/api/health`
2. **AI 服务状态**：`https://[YOUR-RAILWAY-APP].railway.app/api/tryon/status`

### 检查前端

访问 Vercel 提供的 URL，确认：

1. 页面能正常加载
2. 能够注册/登录用户
3. 能够上传衣物图片（图片应存储在 Supabase Storage）

---

## 故障排查

### 数据库连接失败

1. 检查 `DATABASE_URL` 格式是否正确
2. 确认 Supabase 项目没有暂停（免费版会在 7 天无活动后暂停）
3. 检查 Railway 日志

### 图片上传失败

1. 检查 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY` 是否正确
2. 确认 Storage Bucket 已创建且为公开
3. 检查 RLS 策略是否正确配置

### 前端无法连接后端

1. 检查 `VITE_API_URL` 是否指向正确的 Railway URL
2. 确认后端 CORS 配置允许前端域名
3. 检查浏览器控制台错误信息

---

## 免费额度参考

| 服务 | 免费额度 | 超出后 |
|------|----------|--------|
| **Supabase** | 500MB 数据库 + 1GB 存储 + 50K MAU | 按量付费 |
| **Railway** | $5/月额度（约 500 小时） | 按量付费 |
| **Vercel** | 100GB/月带宽 + 无限部署 | 按量付费 |

---

## 下一步

1. 配置自定义域名
2. 设置 CI/CD 自动部署
3. 配置监控和告警
4. 优化性能和缓存
