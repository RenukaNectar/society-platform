import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class WaterBodyType extends Model {
  public id!: string;
  public name!: string | null;
  public water_body_types_hindi!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public societyRegistrations?: any[];

  public static associate(models: any) {
    WaterBodyType.hasMany(models.SocietyRegistration, { foreignKey: 'water_body_type_id', as: 'societyRegistrations' });
  }
}

WaterBodyType.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },

  name: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  water_body_types_hindi: {
    type: DataTypes.STRING(120),
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
    tableName: 'water_body_types',
    modelName: 'WaterBodyType',
    underscored: true,
    indexes: [
      {
        fields: ['name'],
      }
    ]
  }
);

export default WaterBodyType; 