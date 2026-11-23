import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class SocietyType extends Model {
  public id!: string;
  public title!: string;
  public description?: string;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public liquidations?: any[];

  public static associate(models: any) {
    // Remove the association since society_type in Liquidation is a string field, not a foreign key
    // The association was causing issues because it was looking for a non-existent society_type_id column
  }
}

SocietyType.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
}, {
  sequelize,
  tableName: 'society_types',
  modelName: 'SocietyType',
  underscored: true,
  indexes: [
    {
      fields: ['title']
    },
    {
      fields: ['active']
    }
  ]
});

export default SocietyType;
