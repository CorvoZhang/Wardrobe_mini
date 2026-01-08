import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ClothingCategory = sequelize.define('ClothingCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parentId: {
    type: DataTypes.UUID,
    references: {
      model: 'ClothingCategories',
      key: 'id'
    },
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

// 自关联，实现多级分类
ClothingCategory.belongsTo(ClothingCategory, { as: 'parent', foreignKey: 'parentId' });
ClothingCategory.hasMany(ClothingCategory, { as: 'children', foreignKey: 'parentId' });

export default ClothingCategory;