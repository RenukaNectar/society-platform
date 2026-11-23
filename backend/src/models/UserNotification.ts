import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import { IUserNotification, IUserNotificationCreate } from '../types';

class UserNotification extends Model<IUserNotification, IUserNotificationCreate> implements IUserNotification {
  public id!: string;
  public user_id!: string;
  public notification_id!: string;
  public is_read!: boolean;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public notification?: any;
  public user?: any;

  public static associate(models: any) {
    UserNotification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    UserNotification.belongsTo(models.Notification, { foreignKey: 'notification_id', as: 'notification' });
  }
}

UserNotification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notification_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'notifications',
        key: 'id'
      }
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'user_notifications',
    modelName: 'UserNotification',
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['notification_id']
      },
      {
        fields: ['is_read']
      },
      {
        fields: ['active']
      }
    ],
    hooks: {
      beforeCreate: (userNotification: UserNotification) => {
        if (!userNotification.id) {
          userNotification.id = require('uuid').v4();
        }
      }
    }
  }
);

export default UserNotification;
