import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class CooperativeSocietyType extends Model {
  public id!: string;
  public name!: string;
  public sequence!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public societyRegistrations?: any[];

  public static associate(models: any) {
    CooperativeSocietyType.hasMany(models.SocietyRegistration, { foreignKey: 'cooperative_society_type_id', as: 'societyRegistrations' });
  }
}

CooperativeSocietyType.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },

  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  sequence: {
    type: DataTypes.INTEGER,
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
    tableName: 'cooperative_society_types',
    modelName: 'CooperativeSocietyType',
    underscored: true,
    indexes: [
      {
        fields: ['name']
      }
    ]
  }
);

export default CooperativeSocietyType; 