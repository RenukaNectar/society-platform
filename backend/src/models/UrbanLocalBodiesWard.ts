import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class UrbanLocalBodiesWard extends Model {
  public id!: string;
  public state_code!: number;
  public state_name!: string;
  public local_body_code!: number;
  public local_body_name!: string;
  public local_body_name_hindi!: string;
  public ward_code!: number;
  public ward_name!: string;
  public ward_name_hindi!: string;
  public updated_at!: Date;
  public created_at!: Date;
  public is_active!: boolean;

  // Association properties
  public societyRegistrations?: any[];
}

UrbanLocalBodiesWard.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  state_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  state_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  local_body_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  local_body_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  local_body_name_hindi: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ward_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ward_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  ward_name_hindi: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
},
  {
    sequelize,
    tableName: 'urban_local_bodies_wards',
    timestamps: false
  });

export default UrbanLocalBodiesWard; 