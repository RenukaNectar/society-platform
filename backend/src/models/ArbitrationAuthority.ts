import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';
export interface ArbitrationAuthorityAttributes {
  id: string;
  name: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
export interface ArbitrationAuthorityCreate {
  name: string;
  active: boolean;
}

class ArbitrationAuthority extends Model<ArbitrationAuthorityAttributes, ArbitrationAuthorityCreate> implements ArbitrationAuthorityAttributes {
  public id!: string;
  public name!: string;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static associate(models: any) {
    ArbitrationAuthority.hasMany(models.AnnualForm, { foreignKey: 'arbitration_authority', as: 'arbitrationAuthorityAnnualForms' });
  }
}

ArbitrationAuthority.init({
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
    },
    {
      sequelize,
      modelName: 'ArbitrationAuthority',
      tableName: 'arbitration_authorities',
      timestamps: true
    }
);

export default ArbitrationAuthority;