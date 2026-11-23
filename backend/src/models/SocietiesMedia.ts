import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

interface ISocietiesMedia {
  id: string;
  society_id: string;
  media_type: string;
  media_id: string;
  active: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface ISocietiesMediaCreate {
  society_id: string;
  media_type: string;
  media_id: string;
  active?: boolean;
}

class SocietiesMedia extends Model<ISocietiesMedia, ISocietiesMediaCreate> implements ISocietiesMedia {
  public id!: string;
  public society_id!: string;
  public media_type!: string;
  public media_id!: string;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public society?: any;
  public media?: any;

  public static associate(models: any) {
    SocietiesMedia.belongsTo(models.SocietyRegistration, {
      foreignKey: 'society_id',
      as: 'society'
    });

    SocietiesMedia.belongsTo(models.Media, {
      foreignKey: 'media_id',
      as: 'media'
    });
  }
}

SocietiesMedia.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  society_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'society_registrations',
      key: 'id'
    }
  },
  media_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  media_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'media',
      key: 'id'
    }
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
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
  tableName: 'societies_media',
  modelName: 'SocietiesMedia',
  underscored: true,
  indexes: [
    {
      fields: ['society_id']
    },
    {
      fields: ['media_id']
    },
    {
      fields: ['media_type']
    },
    {
      fields: ['active']
    },
    {
      unique: true,
      fields: ['society_id', 'media_id', 'media_type']
    }
  ],
  hooks: {
    beforeCreate: (societiesMedia: SocietiesMedia) => {
      if (!societiesMedia.id) {
        societiesMedia.id = require('uuid').v4();
      }
    }
  }
});

export default SocietiesMedia; 