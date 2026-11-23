import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

interface IBodMember {
  id: string;
  society_id: string;
  agm_id: string;
  name: string;
  designation: string | null;
  gender: string | null;
  category: string | null;
  shareholder_category: string | null;
  mobile: string | null;
  is_co_opted: boolean;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface IBodMemberCreate {
  society_id: string;
  agm_id: string;
  name: string;
  designation?: string | null;
  gender?: string | null;
  category?: string | null;
  shareholder_category?: string | null;
  mobile?: string | null;
  is_co_opted?: boolean;
  is_active?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}

class BodMember extends Model<IBodMember, IBodMemberCreate> implements IBodMember {
  public id!: string;
  public society_id!: string;
  public agm_id!: string;
  public name!: string;
  public designation!: string | null;
  public gender!: string | null;
  public category!: string | null;
  public shareholder_category!: string | null;
  public mobile!: string | null;
  public is_co_opted!: boolean;
  public is_active!: boolean;
  public created_by!: string | null;
  public updated_by!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static associate(models: any) {
    BodMember.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    BodMember.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedByUser' });
    BodMember.belongsTo(models.SocietyRegistration, { foreignKey: 'society_id', as: 'society' });
    BodMember.belongsTo(models.GeneralBodyMeeting, { foreignKey: 'agm_id', as: 'agm' });
  }
}

BodMember.init(
  {
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
    agm_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'general_body_meetings',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    designation: {
      type: DataTypes.STRING(100),
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
      type: DataTypes.TEXT,
      allowNull: true
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    is_co_opted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true
    },
    updated_by: {
      type: DataTypes.UUID,
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
    tableName: 'bod_members',
    modelName: 'BodMember',
    underscored: true,
    indexes: [
      { fields: ['society_id'] },
      { fields: ['agm_id'] },
      { fields: ['name'] },
      { fields: ['designation'] },
      { fields: ['is_active'] }
    ]
  }
);

export default BodMember;
