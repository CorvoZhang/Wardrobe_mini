import app from './index.js';
import { syncDatabase } from './index.js';

// 配置端口
const PORT = process.env.PORT || 5001;

// 启动服务器
app.listen(PORT, async () => {
  await syncDatabase();
  console.log(`Server is running on port ${PORT}`);
});