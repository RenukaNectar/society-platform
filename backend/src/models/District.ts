import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';


class District extends Model {
  public id!: string;
  public state_code!: number | null;
  public district_code!: number | null;
  public name!: string | null;
  public district_headquarters!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public state?: any;
  public blocks?: any[];
  public societyRegistrations?: any[];

  public static associate(models: any) {
    District.belongsTo(models.State, { foreignKey: 'state_code', targetKey: 'state_code', as: 'state' });
    District.hasMany(models.Block, { foreignKey: 'district_code', sourceKey: 'district_code', as: 'blocks' });
    District.hasMany(models.SocietyRegistration, { foreignKey: 'district_id', as: 'societyRegistrations' });
  }
}

District.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },

  state_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  district_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  district_headquarters: {
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
    tableName: 'districts',
    modelName: 'District',
    underscored: true,
    indexes: [
      {
        fields: ['state_code']
      },
      {
        fields: ['district_code']
      },
      {
        fields: ['name']
      }
    ]
  }
);

export default District; 