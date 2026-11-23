import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class AreaOfOperationLevelUrban extends Model {
  public id!: string;
  public society_id!: string | null;
  public area_of_operation_id!: number | null;
  public state_code!: number | null;
  public district_code!: number | null;
  public local_body_type_code!: number | null;
  public local_body_code!: number | null;
  public locality_ward_code!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AreaOfOperationLevelUrban.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },

  society_id: {
    type: DataTypes.STRING(40),
    allowNull: true
  },
  area_of_operation_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  state_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  district_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  local_body_type_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  local_body_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  locality_ward_code: {
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
    tableName: 'area_of_operation_level_urbans',
    modelName: 'AreaOfOperationLevelUrban',
    underscored: true,
    indexes: [
      {
        fields: ['society_id'],
      },
      {
        fields: ['area_of_operation_id']
      },
      {
        fields: ['state_code']
      },
      {
        fields: ['district_code']
      }
    ]
  }
);

export default AreaOfOperationLevelUrban; 