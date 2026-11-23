import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class UrbanLocalBody extends Model {
  public id!: string;
  public state_code!: number;
  public state_name!: string;
  public district_code!: number;
  public district_name!: string;
  public localbody_type_code!: number;
  public localbody_type_name!: string;
  public localbody_type_name_hindi!: string;
  public localbody_code!: number;
  public local_body_name!: string;
  public local_body_name_hindi!: string;
  public updated_at!: Date;
  public created_at!: Date;
  public is_active!: boolean;

}

UrbanLocalBody.init({
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
  district_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  district_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  localbody_type_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  localbody_type_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  localbody_type_name_hindi: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  localbody_code: {
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
}, {
  sequelize,
  tableName: 'urban_local_bodies',
  timestamps: false
});

export default UrbanLocalBody