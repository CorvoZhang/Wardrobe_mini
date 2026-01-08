import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OutfitClothing = sequelize.define('OutfitClothing', {
  outfitId: {
    type: DataTypes.UUID,
    references: {
      model: 'Outfit',
      key: 'id'
    },
    primaryKey: true
  },
  clothingId: {
    type: DataTypes.UUID,
    references: {
      model: 'Clothing',
      key: 'id'
    },
    primaryKey: true
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
});



export default OutfitClothing;