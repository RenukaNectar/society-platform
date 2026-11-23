import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class Bank extends Model {
  public id!: string;
  public name!: string | null;
  public code!: string | null;
  public type!: string | null;
  public ifsc_code!: string | null;
  public micr_code!: string | null;
  public branch_name!: string | null;
  public address!: string | null;
  public city!: string | null;
  public state!: string | null;
  public pincode!: string | null;
  public phone!: string | null;
  public email!: string | null;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Bank.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },

  name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ifsc_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  micr_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  branch_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_active: {
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
    tableName: 'banks',
    modelName: 'Bank',
    underscored: true,
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['code'],
      },
      {
        fields: ['type']
      },
      {
        fields: ['ifsc_code']
      },
      {
        fields: ['is_active']
      }
    ]
  }
);

export default Bank; 