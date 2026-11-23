import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import { INotificationTemplate, INotificationTemplateCreate } from '../types';

class NotificationTemplate extends Model<INotificationTemplate, INotificationTemplateCreate> implements INotificationTemplate {
  public id!: string;
  public title!: string;
  public key!: string;
  public description?: string;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static associate(models: any) {
    // Define associations here if needed
  }
}

NotificationTemplate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255]
      }
    },
    key: {
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
    tableName: 'notification_templates',
    modelName: 'NotificationTemplate',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['key']
      },
      {
        fields: ['active']
      }
    ]
  }
);

export default NotificationTemplate;
