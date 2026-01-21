import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 根据环境变量决定使用 PostgreSQL（Supabase）还是 SQLite
// 生产环境使用 Supabase PostgreSQL: DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV;

let sequelize;

if (DATABASE_URL && NODE_ENV !== 'test') {
  // 生产环境: 使用 PostgreSQL (Supabase)
  // Supabase 连接字符串格式: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
  console.log('📦 数据库模式: PostgreSQL (Supabase)');
  
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Supabase 需要此配置
      }
    },
    pool: {
      max: 5,  // Supabase 免费版连接数限制
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (NODE_ENV === 'test') {
  // 测试环境: 使用 SQLite 内存数据库
  console.log('📦 数据库模式: SQLite (内存测试)');
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    dialectOptions: {
      foreignKeys: true
    }
  });
} else {
  // 开发环境: 使用 SQLite 文件数据库
  console.log('📦 数据库模式: SQLite (本地开发)');
  console.log('💡 提示: 设置 DATABASE_URL 环境变量可连接 Supabase PostgreSQL');
  
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