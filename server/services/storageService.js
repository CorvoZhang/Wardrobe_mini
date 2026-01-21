import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Supabase 配置
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// 创建 Supabase 客户端（使用 service key 以获得完整权限）
let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log('✅ Supabase Storage 服务已初始化');
} else {
  console.log('⚠️ Supabase Storage 运行在本地模式（未配置 SUPABASE_URL 或 SUPABASE_SERVICE_KEY）');
}

// Storage Bucket 名称
export const BUCKETS = {
  CLOTHING: 'clothing-images',
  OUTFITS: 'outfit-images',
  TRYON: 'try-on-results'
};

/**
 * 检查 Supabase Storage 是否可用
 * @returns {boolean}
 */
export function isStorageAvailable() {
  return !!supabase;
}

/**
 * 上传图片到 Supabase Storage
 * @param {Buffer} buffer - 图片 Buffer
 * @param {string} bucket - 存储桶名称
 * @param {string} originalFilename - 原始文件名
 * @param {string} contentType - MIME 类型
 * @returns {Promise<Object>} - 上传结果
 */
export async function uploadImage(buffer, bucket, originalFilename, contentType = 'image/jpeg') {
  // 如果 Supabase 不可用，返回本地存储提示
  if (!supabase) {
    return {
      success: false,
      isLocal: true,
      message: '请配置 Supabase 环境变量以启用云存储'
    };
  }

  try {
    // 生成唯一文件名
    const ext = originalFilename.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${ext}`;
    const filePath = `uploads/${filename}`;

    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase 上传失败:', error);
      return {
        success: false,
        error: error.message,
        message: '图片上传失败'
      };
    }

    // 获取公共 URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('✅ 图片上传成功:', urlData.publicUrl);

    return {
      success: true,
      filename,
      filePath,
      publicUrl: urlData.publicUrl,
      message: '图片上传成功'
    };
  } catch (error) {
    console.error('❌ 上传图片异常:', error);
    return {
      success: false,
      error: error.message,
      message: '上传过程中发生错误'
    };
  }
}

/**
 * 从 URL 下载图片并上传到 Supabase Storage
 * @param {string} imageUrl - 图片 URL
 * @param {string} bucket - 存储桶名称
 * @param {string} prefix - 文件名前缀
 * @returns {Promise<Object>} - 上传结果
 */
export async function uploadFromUrl(imageUrl, bucket, prefix = 'downloaded') {
  if (!supabase) {
    return {
      success: false,
      isLocal: true,
      message: '请配置 Supabase 环境变量以启用云存储'
    };
  }

  try {
    console.log('📥 正在下载图片:', imageUrl);
    
    // 下载图片
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // 根据 content-type 确定扩展名
    let ext = 'png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      ext = 'jpg';
    } else if (contentType.includes('webp')) {
      ext = 'webp';
    } else if (contentType.includes('gif')) {
      ext = 'gif';
    }

    const filename = `${prefix}-${uuidv4()}.${ext}`;
    const filePath = `uploads/${filename}`;

    // 上传到 Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase 上传失败:', error);
      return {
        success: false,
        error: error.message,
        message: '图片上传失败'
      };
    }

    // 获取公共 URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('✅ 图片下载并上传成功:', urlData.publicUrl);

    return {
      success: true,
      filename,
      filePath,
      publicUrl: urlData.publicUrl,
      message: '图片上传成功'
    };
  } catch (error) {
    console.error('❌ 下载上传异常:', error);
    return {
      success: false,
      error: error.message,
      message: '下载上传过程中发生错误'
    };
  }
}

/**
 * 删除 Supabase Storage 中的图片
 * @param {string} bucket - 存储桶名称
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>} - 删除结果
 */
export async function deleteImage(bucket, filePath) {
  if (!supabase) {
    return {
      success: false,
      isLocal: true,
      message: '请配置 Supabase 环境变量'
    };
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('❌ 删除图片失败:', error);
      return {
        success: false,
        error: error.message,
        message: '删除图片失败'
      };
    }

    console.log('✅ 图片删除成功:', filePath);
    return {
      success: true,
      message: '图片删除成功'
    };
  } catch (error) {
    console.error('❌ 删除图片异常:', error);
    return {
      success: false,
      error: error.message,
      message: '删除过程中发生错误'
    };
  }
}

/**
 * 获取文件的公共 URL
 * @param {string} bucket - 存储桶名称
 * @param {string} filePath - 文件路径
 * @returns {string|null} - 公共 URL
 */
export function getPublicUrl(bucket, filePath) {
  if (!supabase) {
    return null;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data?.publicUrl || null;
}

/**
 * 获取 Storage 服务状态
 * @returns {Object} - 服务状态信息
 */
export function getStorageStatus() {
  return {
    available: !!supabase,
    provider: 'Supabase Storage',
    buckets: Object.values(BUCKETS),
    message: supabase 
      ? 'Supabase Storage 服务已就绪' 
      : '本地模式：请配置 SUPABASE_URL 和 SUPABASE_SERVICE_KEY'
  };
}

export default {
  isStorageAvailable,
  uploadImage,
  uploadFromUrl,
  deleteImage,
  getPublicUrl,
  getStorageStatus,
  BUCKETS
};
