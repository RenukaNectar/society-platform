import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import { IStatus, IStatusCreate } from '../types';

class Status extends Model<IStatus, IStatusCreate> implements IStatus {
  public id!: string;
  public key!: string;
  public title!: string;
  public description?: string;
  public is_active!: boolean;
  public created_by?: string | null;
  public updated_by?: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public amendments?: any[];

  public static associate(models: any) {
    // Status has many Amendments
    Status.hasMany(models.Amendment, { foreignKey: 'status_id', as: 'amendments' });

    // Status belongs to User (created by)
    Status.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });

    // Status belongs to User (updated by)
    Status.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedByUser' });
  }
}

Status.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 100]
      }
    },
    title: {
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
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
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
    }
  },
  {
    sequelize,
    tableName: 'statuses',
    modelName: 'Status',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['key']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['updated_by']
      }
    ],
    hooks: {
      beforeCreate: (status: Status) => {
        if (!status.id) {
          status.id = require('uuid').v4();
        }
      }
    }
  }
);

export default Status; 