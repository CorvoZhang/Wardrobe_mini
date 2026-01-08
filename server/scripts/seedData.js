import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 加载环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import sequelize from '../config/database.js';
import ClothingCategory from '../models/ClothingCategory.js';

// 衣物分类数据
const categories = [
  // 上装
  { name: '上衣', parentId: null, order: 1 },
  { name: 'T恤', parentId: null, order: 2 },
  { name: '衬衫', parentId: null, order: 3 },
  { name: '卫衣', parentId: null, order: 4 },
  { name: '毛衣', parentId: null, order: 5 },
  { name: '外套', parentId: null, order: 6 },
  { name: '西装', parentId: null, order: 7 },
  
  // 下装
  { name: '裤子', parentId: null, order: 10 },
  { name: '牛仔裤', parentId: null, order: 11 },
  { name: '休闲裤', parentId: null, order: 12 },
  { name: '短裤', parentId: null, order: 13 },
  { name: '裙子', parentId: null, order: 14 },
  { name: '连衣裙', parentId: null, order: 15 },
  
  // 鞋类
  { name: '鞋子', parentId: null, order: 20 },
  { name: '运动鞋', parentId: null, order: 21 },
  { name: '皮鞋', parentId: null, order: 22 },
  { name: '休闲鞋', parentId: null, order: 23 },
  { name: '高跟鞋', parentId: null, order: 24 },
  { name: '靴子', parentId: null, order: 25 },
  
  // 配饰
  { name: '配饰', parentId: null, order: 30 },
  { name: '帽子', parentId: null, order: 31 },
  { name: '围巾', parentId: null, order: 32 },
  { name: '腰带', parentId: null, order: 33 },
  { name: '包包', parentId: null, order: 34 },
  { name: '首饰', parentId: null, order: 35 },
  
  // 其他
  { name: '内衣', parentId: null, order: 40 },
  { name: '泳装', parentId: null, order: 41 },
  { name: '运动装', parentId: null, order: 42 },
  { name: '睡衣', parentId: null, order: 43 },
  { name: '其他', parentId: null, order: 99 },
];

async function seedDatabase() {
  try {
    console.log('🌱 开始初始化数据库...');
    
    // 同步数据库
    await sequelize.sync();
    console.log('✅ 数据库同步完成');
    
    // 检查是否已有分类数据
    const existingCount = await ClothingCategory.count();
    
    if (existingCount > 0) {
      console.log(`ℹ️  数据库中已存在 ${existingCount} 个分类，跳过初始化`);
      console.log('   如需重新初始化，请先清空 ClothingCategories 表');
    } else {
      // 创建分类数据
      await ClothingCategory.bulkCreate(categories);
      console.log(`✅ 成功创建 ${categories.length} 个衣物分类`);
    }
    
    console.log('🎉 数据初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
seedDatabase();
