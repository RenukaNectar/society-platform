import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

export interface MisappropriationLevelAttributes {
  id: string;
  name: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MisappropriationLevelCreate {
  name: string;
  active: boolean;
}

class MisappropriationLevel extends Model<MisappropriationLevelAttributes, MisappropriationLevelCreate> implements MisappropriationLevelAttributes {
  public id!: string;
  public name!: string;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static associate(models: any) {
    MisappropriationLevel.hasMany(models.AnnualForm, { foreignKey: 'misappropriation_level', as: 'misappropriationLevelAnnualForms' });
  }
}

MisappropriationLevel.init({
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
    modelName: 'MisappropriationLevel',
    tableName: 'misappropriation_levels',
    timestamps: true
  });

  export default MisappropriationLevel;