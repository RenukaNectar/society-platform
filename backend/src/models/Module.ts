import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class Module extends Model {
  public id!: string;
  public name!: string;
  public description?: string;
  public key!: string;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Module.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 100]
      }
    },
    active: {
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
    tableName: 'modules',
    modelName: 'Module',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['key']
      },
      {
        fields: ['active']
      }
    ],
    hooks: {
      beforeCreate: (module: Module) => {
        if (!module.id) {
          module.id = require('uuid').v4();
        }
      }
    }
  }
);

export default Module;
