import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class DistrictsBlocksGpVillage extends Model {
  public id!: string;
  public state_code!: number | null;
  public state_name!: string | null;
  public district_code!: number | null;
  public district_name!: string | null;
  public block_code!: number | null;
  public block_name!: string | null;
  public gram_panchayat_code!: number | null;
  public gram_panchayat_name!: string | null;
  public gram_panchayat_name_hindi!: string | null;
  public village_code!: number | null;
  public village_name!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

DistrictsBlocksGpVillage.init({
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
  state_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  district_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  district_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  block_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  block_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  gram_panchayat_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  gram_panchayat_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  gram_panchayat_name_hindi: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  village_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  village_name: {
    type: DataTypes.STRING(255),
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
    tableName: 'districts_blocks_gp_villages',
    modelName: 'DistrictsBlocksGpVillage',
    underscored: true,
    indexes: [
      {
        fields: ['state_code']
      },
      {
        fields: ['district_code'],
      },
      {
        fields: ['block_code']
      },
      {
        fields: ['gram_panchayat_code']
      },
      {
        fields: ['village_code']
      }
    ]
  }
);

export default DistrictsBlocksGpVillage; 