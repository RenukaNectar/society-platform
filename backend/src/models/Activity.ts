import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import User from './user';

class Activity extends Model {
  public id!: string;
  public title!: string;
  public description?: string;
  public data?: any;
  public reference_id?: string;
  public created_by?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public creator?: User;

  public static associate(models: any) {
    Activity.belongsTo(models.User, { 
      foreignKey: 'created_by', 
      as: 'creator' 
    });
  }
}

Activity.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255],
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  reference_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    // references: {
    //   model: 'users',
    //   key: 'id'
    // }
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
    tableName: 'activities',
    modelName: 'Activity',
    underscored: true,
    indexes: [
      {
        fields: ['title'],
      },
      {
        fields: ['reference_id'],
      },
      {
        fields: ['created_by'],
      },
      {
        fields: ['created_at'],
      }
    ],
    hooks: {
      beforeCreate: (activity: Activity) => {
        if (!activity.id) {
          activity.id = require('uuid').v4();
        }
      }
    }
  });

export default Activity;
