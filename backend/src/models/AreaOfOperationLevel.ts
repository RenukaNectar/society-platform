import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class AreaOfOperationLevel extends Model {
  public id!: string;
  public name!: string | null;
  public description!: string | null;
  public level_type!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public societyRegistrations?: any[];

  public static associate(models: any) {
    AreaOfOperationLevel.hasMany(models.SocietyRegistration, { foreignKey: 'area_of_operation_id', as: 'societyRegistrations' });
  }
}

AreaOfOperationLevel.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },

  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  level_type: {
    type: DataTypes.STRING(50),
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
    tableName: 'area_of_operation_levels',
    modelName: 'AreaOfOperationLevel',
    underscored: true,
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['level_type'],
      }
    ]
  }
);

export default AreaOfOperationLevel; 