import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

interface IMemberOtpVerification {
  id: string;
  member_id: string;
  society_id: string;
  module_name: string | null;
  otp: string;
  otp_expiry: Date;
  is_verified: boolean;
  active: boolean;
  created_by: string | null;
  updated_by: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface IMemberOtpVerificationCreate {
  member_id: string;
  society_id: string;
  module_name?: string | null;
  otp: string;
  otp_expiry: Date;
  is_verified?: boolean;
  active?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}

class MemberOtpVerification extends Model<IMemberOtpVerification, IMemberOtpVerificationCreate> implements IMemberOtpVerification {
  public id!: string;
  public member_id!: string;
  public society_id!: string;
  public module_name!: string | null;
  public otp!: string;
  public otp_expiry!: Date;
  public is_verified!: boolean;
  public active!: boolean;
  public created_by!: string | null;
  public updated_by!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public member?: any;
  public society?: any;
  public createdByUser?: any;
  public updatedByUser?: any;

  public static associate(models: any) {
    MemberOtpVerification.belongsTo(models.Member, { foreignKey: 'member_id', as: 'member' });
    MemberOtpVerification.belongsTo(models.SocietyRegistration, { foreignKey: 'society_id', targetKey: 'society_id', as: 'society' });
    MemberOtpVerification.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    MemberOtpVerification.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedByUser' });
  }
}

MemberOtpVerification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    member_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'members',
        key: 'id'
      }
    },
    society_id: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    module_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    otp: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    otp_expiry: {
      type: DataTypes.DATE,
      allowNull: false
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    active: {
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
    tableName: 'member_otp_verifications',
    modelName: 'MemberOtpVerification',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['member_id'] },
      { fields: ['society_id'] },
      { fields: ['otp_expiry'] },
      { fields: ['active'] },
      { fields: ['created_by'] },
      { fields: ['updated_by'] }
    ]
  }
);

export default MemberOtpVerification;
