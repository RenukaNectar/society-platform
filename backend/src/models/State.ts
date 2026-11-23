import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class State extends Model {
  public id!: string;
  public state_code!: number | null;
  public name!: string | null;
  public hindi_name!: string | null;
  public state_or_ut!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public districts?: any[];
  public blocks?: any[];
  public societyRegistrations?: any[];

  public static associate(models: any) {
    State.hasMany(models.District, { foreignKey: 'state_code', sourceKey: 'state_code', as: 'districts' });
    State.hasMany(models.Block, { foreignKey: 'state_code', sourceKey: 'state_code', as: 'blocks' });
    State.hasMany(models.SocietyRegistration, { foreignKey: 'state_id', as: 'societyRegistrations' });
  }
}

State.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    state_code: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    hindi_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state_or_ut: {
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
    tableName: 'states',
    modelName: 'State',
    underscored: true,
    indexes: [
      {
        fields: ['state_code']
      },
      {
        fields: ['name']
      }
    ]
  }
);

export default State; 