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
