import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Scene 模型 - 穿搭场景
 * 用于存储预设和自定义场景，支持多场景穿搭生成
 */
const Scene = sequelize.define('Scene', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '场景名称'
  },
  nameEn: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '场景英文名称（用于AI提示词）'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '场景描述'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'general',
    comment: '场景分类：outdoor/indoor/formal/casual/seasonal/special'
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '场景预览图片URL'
  },
  thumbnailUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '场景缩略图URL'
  },
  promptKeywords: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI生成时的关键词提示'
  },
  lightingStyle: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'natural lighting',
    comment: '光照风格'
  },
  backgroundStyle: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '背景风格描述'
  },
  isPreset: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否为预设场景'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '自定义场景的用户ID（预设场景为null）'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

export default Scene;
