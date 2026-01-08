import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const UserPreference = sequelize.define('UserPreference', {
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    },
    primaryKey: true
  },
  stylePreference: {
    type: DataTypes.JSON
  },
  seasonPreference: {
    type: DataTypes.JSON
  },
  brandPreference: {
    type: DataTypes.JSON
  },
  colorPreference: {
    type: DataTypes.JSON
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

User.hasOne(UserPreference, { foreignKey: 'userId' });
UserPreference.belongsTo(User, { foreignKey: 'userId' });

export default UserPreference;