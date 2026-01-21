import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OutfitClothing = sequelize.define('OutfitClothing', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  outfitId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Outfits',
      key: 'id'
    }
  },
  clothingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Clothings',
      key: 'id'
    }
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'main'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['outfitId', 'clothingId']
    }
  ]
});



export default OutfitClothing;