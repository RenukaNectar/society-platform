import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import { IHistory, IHistoryCreate } from '../types';

class History extends Model<IHistory, IHistoryCreate> implements IHistory {
  public id!: string;
  public resource!: string;
  public type!: string;
  public comments?: string;
  public reference_id!: string;
  public created_by?: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public active!: boolean;
  public data?: string | null;

  // Association properties
  public createdByUser?: any;

  public static associate(models: any) {
    // History belongs to User (created by)
    History.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
  }
}

History.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    resource: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
        notEmpty: true
      },
      comment: 'Name of the resource/table being tracked'
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50],
        notEmpty: true,
        isIn: [['create', 'update', 'delete', 'status_change', 'approval', 'rejection', 'resubmit', 'other']]
      },
      comment: 'Type of action (create, update, delete, etc.)'
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional comments or description of the change'
    },
    reference_id: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'ID of the record being tracked'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who created this history record'
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
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this history record is active'
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional JSON field to store additional data related to the change'
    }

  },
  {
    sequelize,
    tableName: 'history',
    modelName: 'History',
    underscored: true,
    indexes: [
      {
        fields: ['resource']
      },
      {
        fields: ['reference_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['active']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeCreate: (history: History) => {
        if (!history.id) {
          history.id = require('uuid').v4();
        }
      }
    }
  }
);

export default History;
