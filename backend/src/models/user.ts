import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import { IUser, IUserCreate } from '../types';
import Role from './Role';
import Session from './Session';
import SocietyRegistration from './SocietyRegistration';
import Member from './Member';
import State from './State';
import Notification from './Notification';
import Status from './Status';
import Media from './Media';
import District from './District';

class User extends Model<IUser, IUserCreate> implements IUser {
  public id!: string;
  public email!: string;
  public password!: string;
  public first_name!: string;
  public last_name!: string;
  public phone?: string;
  public address?: string;
  public aadhar_number?: string;
  public pan_number?: string;
  public role_id!: string;
  public is_active!: boolean;
  public is_available!: boolean;
  public unavailable_since?: Date | null;
  public unavailable_until?: Date | null;
  public unavailable_reason?: string | null;
  public is_hq!: boolean;
  public is_locked!: boolean;
  public locked_at?: Date;
  public failed_login_attempts!: number;
  public token_version!: number;
  public last_login?: Date;
  public reset_token?: string;
  public reset_token_expiry?: Date;
  public otp?: string;
  public otp_expiry?: Date;
  public failed_otp_attempts!: number;
  public otp_locked_until?: Date;
  public is_email_verified?: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public state_id?: string;
  public district_id?: string;
  public signature_media_id?: string;
  // Association properties
  public role?: any;
  public sessions?: any[];
  public createdSocietyRegistrations?: any[];
  public updatedSocietyRegistrations?: any[];
  public createdMembers?: any[];
  public updatedMembers?: any[];
  public createdStates?: any[];
  public updatedStates?: any[];
  public notifications?: any[];
  public createdMedia?: any[];
  public updatedMedia?: any[];
  public createdAmendments?: any[];
  public updatedAmendments?: any[];
  public officerAmendments?: any[];
  public qrcsAmendments?: any[];
  public bye_laws?: string | null;
  public bank_certificate?: string | null;
  public economic_scheme?: string | null;
  public contributor_list?: string | null;
  public custom_documents?: string | null;
  public state?: any;
  public district?: any;
  public url?: any;

  // Instance methods
  public getFullName(): string {
    return `${this.first_name} ${this.last_name}`;
  }

  public override toJSON(): any {
    const values = Object.assign({}, this.get());
    delete (values as any).password;
    delete (values as any).reset_token;
    return values;
  }

  public static associate(models: any) {
    User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
    User.hasMany(Session, { foreignKey: 'user_id', as: 'sessions' });
    User.hasMany(SocietyRegistration, { foreignKey: 'created_by', as: 'createdSocietyRegistrations' });
    User.hasMany(SocietyRegistration, { foreignKey: 'updated_by', as: 'updatedSocietyRegistrations' });
    User.hasMany(Member, { foreignKey: 'created_by', as: 'createdMembers' });
    User.hasMany(Member, { foreignKey: 'updated_by', as: 'updatedMembers' });
    User.hasMany(State, { foreignKey: 'created_by', as: 'createdStates' });
    User.hasMany(State, { foreignKey: 'updated_by', as: 'updatedStates' });
    User.hasMany(Notification, { foreignKey: 'created_by', as: 'notifications' });
    User.hasMany(Media, { foreignKey: 'created_by', as: 'createdMedia' });
    User.hasMany(Media, { foreignKey: 'updated_by', as: 'updatedMedia' });
    User.hasMany(models.Amendment, { foreignKey: 'created_by', as: 'createdAmendments' });
    User.hasMany(models.Amendment, { foreignKey: 'updated_by', as: 'updatedAmendments' });
    User.hasMany(models.AnnualForm, { foreignKey: 'created_by', as: 'createdAnnualForms' });
    User.hasMany(models.AnnualForm, { foreignKey: 'updated_by', as: 'updatedAnnualForms' });
    User.belongsTo(State, { foreignKey: 'state_id', as: 'state' });
    User.belongsTo(District, { foreignKey: 'district_id', as: 'district' });
    User.belongsTo(Media, { foreignKey: 'signature_media_id', as: 'media' });
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    aadhar_number: {
      type: DataTypes.STRING(12),
      allowNull: true,
      validate: {
        len: [12, 12],
        is: /^[0-9]{12}$/
      }
    },
    pan_number: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        len: [10, 10],
        is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      }
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    unavailable_since: {
      type: DataTypes.DATE,
      allowNull: true
    },
    unavailable_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    unavailable_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_hq: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    locked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when account was locked'
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 10
      }
    },
    token_version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reset_token_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    otp: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Hashed OTP for password reset'
    },
    otp_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'OTP expiry timestamp'
    },
    failed_otp_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Number of consecutive failed OTP verification attempts'
    },
    otp_locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp until which the account is locked due to failed OTP attempts'
    },
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Tracks whether user email ownership has been verified'
    },
    state_id: {
      type: DataTypes.STRING(40),
      allowNull: true,
      references: {
        model: 'states',
        key: 'id'
      }
    },
    district_id: {
      type: DataTypes.STRING(40),
      allowNull: true,
      references: {
        model: 'districts',
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
    },
    signature_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role_id']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['is_hq']
      },
      {
        fields: ['is_locked']
      },
      {
        fields: ['aadhar_number']
      },
      {
        fields: ['pan_number']
      },
      {
        fields: ['signature_media_id']
      },
      {
        fields: ['is_available']
      },
      {
        fields: ['unavailable_until']
      }
    ],
    hooks: {
      beforeCreate: (user: User) => {
        if (!user.id) {
          user.id = require('uuid').v4();
        }
      }
    }
  }
);

export default User; 