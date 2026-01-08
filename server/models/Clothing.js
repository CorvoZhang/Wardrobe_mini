import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import ClothingCategory from './ClothingCategory.js';

const Clothing = sequelize.define('Clothing', {
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
  categoryId: {
    type: DataTypes.UUID,
    references: {
      model: ClothingCategory,
      key: 'id'
    },
    allowNull: false
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
User.hasMany(Clothing, { foreignKey: 'userId' });
Clothing.belongsTo(User, { foreignKey: 'userId' });

ClothingCategory.hasMany(Clothing, { foreignKey: 'categoryId', as: 'category' });
Clothing.belongsTo(ClothingCategory, { foreignKey: 'categoryId', as: 'category' });

export default Clothing;