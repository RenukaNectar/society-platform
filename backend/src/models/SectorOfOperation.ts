import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class SectorOfOperation extends Model {
  public id!: string;
  public name!: string;
  public description?: string;
  public respective_table?: string;
  public code?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public societyRegistrations?: any[];

  public static associate(models: any) {
    SectorOfOperation.hasMany(models.SocietyRegistration, { foreignKey: 'sector_of_operation', as: 'societyRegistrations' });
  }
}

SectorOfOperation.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },

  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  respective_table: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  code: {
    type: DataTypes.STRING(100),
    allowNull: true
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
    tableName: 'sector_of_operations',
    modelName: 'SectorOfOperation',
    underscored: true,
    indexes: [
      {
        fields: ['name'],
      }
    ]
  }
);

export default SectorOfOperation; 