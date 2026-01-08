import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Clothing from './Clothing.js';

const ClothingImage = sequelize.define('ClothingImage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  clothingId: {
    type: DataTypes.UUID,
    references: {
      model: Clothing,
      key: 'id'
    },
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imageType: {
    type: DataTypes.ENUM('original', 'processed'),
    allowNull: false,
    defaultValue: 'original'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 关联关系
Clothing.hasMany(ClothingImage, { foreignKey: 'clothingId', as: 'images' });
ClothingImage.belongsTo(Clothing, { foreignKey: 'clothingId' });

export default ClothingImage;