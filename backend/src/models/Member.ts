import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

interface IMember {
  id: string;
  name: string | null;
  gender: string | null;
  category: string | null;
  shareholder_category: string | null;
  mobile: string | null;
  society_id: string;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  designation?: string | null;
  is_co_opted?: boolean;
  is_bod?: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface IMemberCreate {
  name?: string;
  gender?: string;
  category?: string;
  shareholder_category?: string | null;
  mobile?: string;
  society_id: string;
  is_active?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  designation?: string | null;
  is_co_opted?: boolean;
  is_bod?: boolean;
}

class Member extends Model<IMember, IMemberCreate> implements IMember {
  public id!: string;
  public name!: string | null;
  public gender!: string | null;
  public category!: string | null;
  public shareholder_category!: string | null;
  public mobile!: string | null;
  public society_id!: string;
  public is_active!: boolean;
  public created_by!: string | null;
  public updated_by!: string | null;
  public designation!: string | null;
  public is_co_opted!: boolean;
  public is_bod!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public createdByUser?: any;
  public updatedByUser?: any;
  public society?: any;

  public static associate(models: any) {
    Member.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    Member.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedByUser' });
    Member.belongsTo(models.SocietyRegistration, { foreignKey: 'society_id', targetKey: 'society_id', as: 'society' });
    if (models.MemberOtpVerification) {
      Member.hasMany(models.MemberOtpVerification, { foreignKey: 'member_id', as: 'otpVerifications' });
    }
  }
}

Member.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    shareholder_category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Class A - Shareholder | Class B - Nominal Shareholder'
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    society_id: {
      type: DataTypes.STRING(40),
      allowNull: false,
      references: {
        model: 'society_registrations',
        key: 'society_id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    designation: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    is_co_opted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_bod: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'members',
    modelName: 'Member',
    underscored: true,
    indexes: [
      {
        fields: ['society_id']
      },
      {
        fields: ['name']
      },
      {
        fields: ['gender']
      },
      {
        fields: ['category']
      },
      {
        fields: ['shareholder_category']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['updated_by']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['designation']
      },
      {
        fields: ['mobile']
      },
      {
        fields: ['is_co_opted']
      },
      {
        fields: ['is_bod']
      }
    ]
  }
);

export default Member; 