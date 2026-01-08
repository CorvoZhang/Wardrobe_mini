import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Clothing from './Clothing.js';
import OutfitClothing from './OutfitClothing.js';

const Outfit = sequelize.define('Outfit', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  imageUrl: {
    type: DataTypes.STRING
  },
  occasion: {
    type: DataTypes.STRING
  },
  season: {
    type: DataTypes.STRING
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
User.hasMany(Outfit, { foreignKey: 'userId' });
Outfit.belongsTo(User, { foreignKey: 'userId' });

// 与Clothing的多对多关联
Outfit.belongsToMany(Clothing, {
  through: OutfitClothing,
  foreignKey: 'outfitId',
  otherKey: 'clothingId',
  as: 'clothing' // 确保别名与测试期望一致
});

Clothing.belongsToMany(Outfit, {
  through: OutfitClothing,
  foreignKey: 'clothingId',
  otherKey: 'outfitId'
});

export default Outfit;