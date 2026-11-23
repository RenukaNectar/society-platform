import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import Permission from './Permission';

class RolePermission extends Model {
  public id!: string;
  public role_id!: string;
  public permission_id!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static associate(models: any) {
    RolePermission.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    RolePermission.belongsTo(models.Permission, { foreignKey: 'permission_id', as: 'permission' });
  }
}

RolePermission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    permission_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id'
      }
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
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    }
  },
  {
    sequelize,
    tableName: 'role_permissions',
    modelName: 'RolePermission',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'permission_id']
      }
    ],
    hooks: {
      beforeCreate: (rolePermission: RolePermission) => {
        if (!rolePermission.id) {
          rolePermission.id = require('uuid').v4();
        }
      }
    }
  }
);

export default RolePermission;
