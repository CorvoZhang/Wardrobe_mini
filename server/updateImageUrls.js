import db from './config/database.js';
import ClothingImage from './models/ClothingImage.js';

// 更新现有图片URL为绝对路径
async function updateImageUrls() {
  try {
    // 获取所有图片记录
    const images = await ClothingImage.findAll();
    
    // 遍历并更新每个图片的URL
    for (const image of images) {
      // 如果URL已经是绝对路径，则跳过
      if (image.imageUrl.startsWith('http')) {
        continue;
      }
      
      // 构建绝对URL
      const absoluteUrl = `http://localhost:5001${image.imageUrl}`;
      
      // 更新记录
      await image.update({ imageUrl: absoluteUrl });
      console.log(`Updated image URL: ${image.id} -> ${absoluteUrl}`);
    }
    
    console.log('All image URLs updated successfully!');
  } catch (error) {
    console.error('Error updating image URLs:', error);
  } finally {
    // 关闭数据库连接
    await db.close();
  }
}

// 执行更新
global.__dirname = '.';
updateImageUrls();