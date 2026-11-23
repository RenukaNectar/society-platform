import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class RegistrationAuthority extends Model {
  public id!: string;
  public name!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public societyRegistrations?: any[];

  public static associate(models: any) {
    RegistrationAuthority.hasMany(models.SocietyRegistration, { foreignKey: 'registration_authoritie_id', as: 'societyRegistrations' });
  }
}

RegistrationAuthority.init({
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
    tableName: 'registration_authorities',
    modelName: 'RegistrationAuthority',
    underscored: true,
    indexes: [
      {
        fields: ['name'],
      }
    ]
  }
);

export default RegistrationAuthority; 