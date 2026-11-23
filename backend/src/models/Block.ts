import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class Block extends Model {
  public id!: string;
  public state_code!: number | null;
  public district_code!: number | null;
  public block_code!: number | null;
  public name!: string | null;
  public block_name_hindi!: string | null;
  public name_local!: string | null;
  public block_version!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public state?: any;
  public district?: any;
  public societyRegistrations?: any[];

  public static associate(models: any) {
    Block.belongsTo(models.State, { foreignKey: 'state_code', targetKey: 'state_code', as: 'state' });
    Block.belongsTo(models.District, { foreignKey: 'district_code', targetKey: 'district_code', as: 'district' });
    Block.hasMany(models.SocietyRegistration, { foreignKey: 'block_id', as: 'societyRegistrations' });
  }
}

Block.init({
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
  block_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  block_name_hindi: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  name_local: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  block_version: {
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
    tableName: 'blocks',
    modelName: 'Block',
    underscored: true,
    indexes: [
      {
        fields: ['state_code'],
      },
      {
        fields: ['district_code'],
      },
      {
        fields: ['block_code'],
      },
      {
        fields: ['name'],
      }
    ]
  }
);

export default Block; 