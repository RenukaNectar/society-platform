import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class Permission extends Model {
  public id!: string;
  public name!: string;
  public description?: string;
  public resource!: string;
  public action!: string;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public roles?: any[];

  public static associate(models: any) {
    Permission.belongsToMany(models.Role, { through: models.RolePermission, foreignKey: 'permission_id', otherKey: 'role_id', as: 'roles' });
  }
}

Permission.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },

  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resource: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [1, 50],
      isIn: [['create', 'read', 'update', 'delete', 'list', 'approve', 'reject', 'view', 'edit']]
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true
  }
},
  {
    sequelize,
    tableName: 'permissions',
    modelName: 'Permission',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name']
      },

      {
        fields: ['resource']
      },
      {
        fields: ['action']
      },
      {
        fields: ['is_active']
      },
      {
        unique: true,
        fields: ['resource', 'action']
      }
    ],
    hooks: {
      beforeCreate: (permission: Permission) => {
        if (!permission.id) {
          permission.id = require('uuid').v4();
        }
      }
    }
  }
);

export default Permission; 