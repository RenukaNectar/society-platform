import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import User from './user';
import Permission from './Permission';

class Role extends Model {
  public id!: string;
  public name!: string;
  public description?: string;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public users?: any[];
  public permissions?: any[];

  public static associate(models: any) {
    Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
    Role.belongsToMany(Permission, { through: models.RolePermission, foreignKey: 'role_id', otherKey: 'permission_id', as: 'permissions' });
  }
}

Role.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },

  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 100],
      is: /^[a-zA-Z0-9\s_-]+$/
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
},
  {
    sequelize,
    tableName: 'roles',
    modelName: 'Role',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
      }
    ],
    hooks: {
      beforeCreate: (role: Role) => {
        if (!role.id) {
          role.id = require('uuid').v4();
        }
      }
    }
  });

export default Role; 