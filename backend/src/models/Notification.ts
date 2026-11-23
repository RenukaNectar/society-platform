import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import { INotification, INotificationCreate } from '../types';

class Notification extends Model<INotification, INotificationCreate> implements INotification {
  public id!: string;
  public title!: string;
  public description?: string;
  public redirect_path?: string;
  public data?: any;
  public is_read!: boolean;
  public created_by!: string;
  public notification_template_id?: string | null;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public createdByUser?: any;
  public notificationTemplate?: any;

  public static associate(models: any) {
    Notification.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    if (models.NotificationTemplate) {
      Notification.belongsTo(models.NotificationTemplate, { foreignKey: 'notification_template_id', as: 'notificationTemplate' });
    }
  }
}

Notification.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    redirect_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: [0, 500]
      }
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true, // Allow null for system-generated notifications
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notification_template_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'notification_templates',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
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
    tableName: 'notifications',
    modelName: 'Notification',
    underscored: true,
    indexes: [
      {
        fields: ['created_by']
      },
      {
        fields: ['is_read']
      },
      {
        fields: ['active']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeCreate: (notification: Notification) => {
        if (!notification.id) {
          notification.id = require('uuid').v4();
        }
      }
    }
  }
);

export default Notification; 