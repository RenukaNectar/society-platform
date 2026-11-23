import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

export interface CostOfManagementTypeAttributes {
  id: string;
  name: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CostOfManagementTypeCreate {
  name: string;
  active: boolean;
}


class CostOfManagementType extends Model<CostOfManagementTypeAttributes, CostOfManagementTypeCreate> implements CostOfManagementTypeAttributes {
  public id!: string;
  public name!: string;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static associate(models: any) {
    CostOfManagementType.hasMany(models.AnnualForm, { foreignKey: 'cost_of_management_type', as: 'costOfManagementTypeAnnualForms' });
  }
}

CostOfManagementType.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'CostOfManagementType',
  tableName: 'cost_of_management_types',
  timestamps: true
});

export default CostOfManagementType;
