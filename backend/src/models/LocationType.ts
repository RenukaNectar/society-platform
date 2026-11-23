import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class LocationType extends Model {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties

  public static associate(models: any) {
    // No associations needed - location_of_head_quarter is not a foreign key
  }
}

LocationType.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
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
    tableName: 'location_types',
    modelName: 'LocationType',
    underscored: true,
    indexes: [
      {
        fields: ['name'],
      }
    ]
  }
);

export default LocationType; 