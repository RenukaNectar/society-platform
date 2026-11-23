import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface AuditorAttributes {
  id: string;
  sl_no: number;
  name: string;
  address: string;
  mobile1: string;
  mobile2?: string;
  email: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuditorCreationAttributes extends Optional<AuditorAttributes, 'id' | 'sl_no' | 'is_active' | 'created_at' | 'updated_at'> {}

class Auditor extends Model<AuditorAttributes, AuditorCreationAttributes> implements AuditorAttributes {
  public id!: string;
  public sl_no!: number;
  public name!: string;
  public address!: string;
  public mobile1!: string;
  public mobile2?: string;
  public email!: string[];
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Auditor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    sl_no: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    mobile1: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    mobile2: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      get() {
        const rawValue = this.getDataValue('email');
        if (Array.isArray(rawValue)) {
          return rawValue;
        }
        if (typeof rawValue === 'string') {
          try {
            return JSON.parse(rawValue);
          } catch (error) {
            console.warn('Invalid JSON in email field:', rawValue);
            return [];
          }
        }
        return rawValue || [];
      },
      set(value: string[]) {
        if (!Array.isArray(value)) {
          throw new Error('Email must be an array of strings');
        }
        // Validate that all items are strings
        if (!value.every(item => typeof item === 'string')) {
          throw new Error('All email items must be strings');
        }
        this.setDataValue('email', value);
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'auditors',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: (auditor: Auditor) => {
        if (!auditor.id) {
          auditor.id = uuidv4();
        }
      },
      beforeUpdate: (auditor: Auditor) => {
        auditor.setDataValue('updated_at', new Date());
      },
    },
  }
);

export default Auditor;
