import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class Session extends Model {
  public id!: string;
  public user_id!: string;
  public expires!: Date;
  public data!: any;
  public created_by!: string | null;
  public updated_by!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public user?: any;

  public static associate(models: any) {
    Session.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

Session.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
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
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  expires: {
    type: DataTypes.DATE,
    allowNull: false
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
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
    tableName: 'sessions',
    modelName: 'Session',
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['updated_by']
      },
      {
        fields: ['expires']
      }
    ],
    hooks: {
      beforeCreate: (session: Session) => {
        if (!session.id) {
          session.id = require('uuid').v4();
        }
      }
    }
  }
);

export default Session; 