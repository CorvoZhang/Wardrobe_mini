import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Clothing from './Clothing.js';

const TryOnHistory = sequelize.define('TryOnHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    },
    allowNull: false
  },
  clothingId: {
    type: DataTypes.UUID,
    references: {
      model: Clothing,
      key: 'id'
    },
    allowNull: true // 允许为空，因为衣物可能被删除
  },
  modelImageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '模特图片 URL（预设或用户上传）'
  },
  modelType: {
    type: DataTypes.ENUM('preset', 'upload'),
    defaultValue: 'preset',
    comment: '模特图片类型：预设或用户上传'
  },
  presetModelId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '如果是预设模特，存储预设模特 ID'
  },
  clothingImageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '衣物图片 URL'
  },
  generatedImageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '生成的试穿效果图 URL'
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'upper_body',
    comment: '衣物类别：upper_body, lower_body, dresses'
  },
  sceneId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '使用的场景 ID'
  },
  isMock: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为 Mock 模式生成'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'completed',
    comment: '生成状态'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '如果失败，存储错误信息'
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

// 关联关系
User.hasMany(TryOnHistory, { foreignKey: 'userId' });
TryOnHistory.belongsTo(User, { foreignKey: 'userId' });

Clothing.hasMany(TryOnHistory, { foreignKey: 'clothingId' });
TryOnHistory.belongsTo(Clothing, { foreignKey: 'clothingId', as: 'clothing' });

export default TryOnHistory;
