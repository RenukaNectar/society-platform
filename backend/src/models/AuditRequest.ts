import { Model, DataTypes, Sequelize, Association } from 'sequelize';
import sequelize from '../config/sequelize';
import SocietyRegistration from './SocietyRegistration';
import User from './user';
import Media from './Media';
import Status from './Status';

interface AuditRequestAttributes {
  id: string;
  society_registration_id: string;
  district_id?: string | null;
  financial_year: string;
  auditor_name: string;
  auditor_registration_number: string | null;
  audit_completion_date: Date;
  audit_classification: 'A' | 'B' | 'C' | 'D';
  agm_date?: Date;
  bod_meeting_date?: Date;
  agm_total_members_on_roll?: number;
  agm_members_attended?: number;
  bod_total_members_on_roll?: number;
  bod_members_attended?: number;
  turnover?: number;
  profit_loss?: number;
  profit_loss_type?: string;
  gross_profit?: number;
  working_capital?: number;
  accumulated_profit?: number;
  accumulated_loss?: number;
  audit_fee_paid?: number;
  audit_accounts_media_id?: string;
  audit_note_media_id?: string;
  vital_stats_form_media_id?: string;
  shareholder_list_media_id?: string;
  agm_bod_minutes_media_id?: string;
  auditor_appointment_letter_media_id?: string;
  registration_certificate_media_id?: string;
  abstract_closing_stock_media_id?: string;
  asset_list_depreciation_media_id?: string;
  bye_laws: string | null;
  declaration_accepted: boolean;
  status_id: string;
  workflow_status?: string | null;
  assigned_to_user_id?: string | null;
  status_changed_by?: string | null;
  status_changed_at?: Date | null;
  submission_date?: Date;
  assigned_officer_id?: string;
  officer_review_date?: Date;
  audit_order_issued: boolean;
  audit_order_number?: string;
  audit_order_date?: Date;
  audit_order_document_path?: string;
  rejection_reason?: string;
  rejection_date?: Date;
  remarks?: string;
  additional_notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;

  // Association properties
  societyRegistration?: SocietyRegistration;
  createdBy?: User;
  updatedBy?: User;
  assignedOfficer?: User;
  status?: Status;
  statusChangedBy?: User;
  auditAccountsMedia?: Media;
  auditNoteMedia?: Media;
  vitalStatsFormMedia?: Media;
  shareholderListMedia?: Media;
  agmBodMinutesMedia?: Media;
  auditorAppointmentLetterMedia?: Media;
  registrationCertificateMedia?: Media;
  abstractClosingStockMedia?: Media;
  assetListDepreciationMedia?: Media;
  byeLawsMedia?: Media;
}

interface AuditRequestCreationAttributes extends Omit<AuditRequestAttributes, 'id' | 'created_at' | 'updated_at'> { }

class AuditRequest extends Model<AuditRequestAttributes, AuditRequestCreationAttributes> implements AuditRequestAttributes {
  public id!: string;
  public society_registration_id!: string;
  public district_id?: string | null;
  public financial_year!: string;
  public auditor_name!: string;
  public auditor_registration_number!: string | null;
  public audit_completion_date!: Date;
  public audit_classification!: 'A' | 'B' | 'C' | 'D';
  public agm_date?: Date;
  public bod_meeting_date?: Date;
  public agm_total_members_on_roll?: number;
  public agm_members_attended?: number;
  public bod_total_members_on_roll?: number;
  public bod_members_attended?: number;
  public turnover?: number;
  public profit_loss?: number;
  public profit_loss_type?: string;
  public gross_profit?: number;
  public working_capital?: number;
  public accumulated_profit?: number;
  public accumulated_loss?: number;
  public audit_fee_paid?: number;
  public audit_accounts_media_id?: string;
  public audit_note_media_id?: string;
  public vital_stats_form_media_id?: string;
  public shareholder_list_media_id?: string;
  public agm_bod_minutes_media_id?: string;
  public auditor_appointment_letter_media_id?: string;
  public registration_certificate_media_id?: string;
  public abstract_closing_stock_media_id?: string;
  public asset_list_depreciation_media_id?: string;
  public bye_laws!: string | null;
  public declaration_accepted!: boolean;
  public status_id!: string;
  public workflow_status?: string | null;
  public assigned_to_user_id?: string | null;
  public status_changed_by?: string | null;
  public status_changed_at?: Date | null;
  public submission_date?: Date;
  public assigned_officer_id?: string;
  public officer_review_date?: Date;
  public audit_order_issued!: boolean;
  public audit_order_number?: string;
  public audit_order_date?: Date;
  public audit_order_document_path?: string;
  public rejection_date?: Date;
  public remarks?: string;
  public additional_notes?: string;
  public created_by?: string;
  public updated_by?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public societyRegistration?: SocietyRegistration;
  public createdBy?: User;
  public updatedBy?: User;
  public assignedOfficer?: User;
  public status?: Status;
  public statusChangedBy?: User;
  public auditAccountsMedia?: Media;
  public auditNoteMedia?: Media;
  public vitalStatsFormMedia?: Media;
  public shareholderListMedia?: Media;
  public agmBodMinutesMedia?: Media;
  public auditorAppointmentLetterMedia?: Media;
  public registrationCertificateMedia?: Media;
  public abstractClosingStockMedia?: Media;
  public assetListDepreciationMedia?: Media;
  public byeLawsMedia?: Media;

  static associate(models: any) {
    // console.log('Setting up AuditRequest associations');
    AuditRequest.belongsTo(models.SocietyRegistration, {
      foreignKey: 'society_registration_id',
      as: 'societyRegistration'
    });
    AuditRequest.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'createdBy'
    });
    AuditRequest.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updatedBy'
    });
    AuditRequest.belongsTo(models.User, {
      foreignKey: 'assigned_officer_id',
      as: 'assignedOfficer'
    });
    AuditRequest.belongsTo(models.Status, {
      foreignKey: 'status_id',
      as: 'status'
    });
    AuditRequest.belongsTo(models.User, {
      foreignKey: 'status_changed_by',
      as: 'statusChangedByUser'
    });
    AuditRequest.belongsTo(models.Media, {
      foreignKey: 'audit_accounts_media_id',
      as: 'auditAccountsMedia'
    });
    AuditRequest.belongsTo(models.Media, {
      foreignKey: 'audit_note_media_id',
      as: 'auditNoteMedia'
    });
    AuditRequest.belongsTo(models.Media, {
      foreignKey: 'vital_stats_form_media_id',
      as: 'vitalStatsFormMedia'
    });
    AuditRequest.belongsTo(models.Media, {
      foreignKey: 'shareholder_list_media_id',
      as: 'shareholderListMedia'
    });
    AuditRequest.belongsTo(models.Media, {
      foreignKey: 'agm_bod_minutes_media_id',
      as: 'agmBodMinutesMedia'
    });
    AuditRequest.belongsTo(models.Media, {
      foreignKey: 'auditor_appointment_letter_media_id',
      as: 'auditorAppointmentLetterMedia'
    });
    AuditRequest.belongsTo(models.Media, {
      foreignKey: 'registration_certificate_media_id',
      as: 'registrationCertificateMedia'
    });
    AuditRequest.belongsTo(models.Media, {
      foreignKey: 'abstract_closing_stock_media_id',
      as: 'abstractClosingStockMedia'
    });
    AuditRequest.belongsTo(models.Media, {
      foreignKey: 'asset_list_depreciation_media_id',
      as: 'assetListDepreciationMedia'
    });
    AuditRequest.belongsTo(models.Media, {
      foreignKey: 'bye_laws',
      as: 'byeLawsMedia'
    });
  }

  override toJSON() {
    const attributes: any = { ...this.get() };
    attributes.created_at = attributes.createdAt;
    attributes.updated_at = attributes.updatedAt;
    delete attributes.createdAt;
    delete attributes.updatedAt;
    return attributes;
  }
}

AuditRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    society_registration_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'society_registrations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    district_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'districts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    financial_year: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'Format: YYYY-YY (e.g., 2024-25)'
    },
    auditor_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    auditor_registration_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    audit_completion_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    audit_classification: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D'),
      allowNull: false,
      comment: 'Audit classification: A, B, C, or D'
    },
    agm_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    bod_meeting_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    agm_total_members_on_roll: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    agm_members_attended: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    bod_total_members_on_roll: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    bod_members_attended: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    turnover: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Annual turnover amount'
    },
    profit_loss: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Profit or loss amount'
    },
    profit_loss_type: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Type of profit_loss value: profit or loss'
    },
    gross_profit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Gross profit amount'
    },
    working_capital: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    accumulated_profit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    accumulated_loss: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    audit_fee_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    audit_accounts_media_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    audit_note_media_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    vital_stats_form_media_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    shareholder_list_media_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    agm_bod_minutes_media_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    auditor_appointment_letter_media_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    registration_certificate_media_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    abstract_closing_stock_media_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    asset_list_depreciation_media_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    bye_laws: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Bye laws document (FK to media.id)',
    },
    declaration_accepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'statuses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    workflow_status: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'module_workflows',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    assigned_to_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    status_changed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    status_changed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    submission_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    assigned_officer_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    officer_review_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    audit_order_issued: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    audit_order_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    audit_order_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    audit_order_document_path: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    rejection_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true
    },
    additional_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    updated_by: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    }
  },
  {
    sequelize,
    tableName: 'audit_requests',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['society_registration_id']
      },
      {
        fields: ['district_id']
      },
      {
        fields: ['status_id']
      },
      {
        fields: ['workflow_status']
      },
      {
        fields: ['assigned_to_user_id']
      },
      {
        fields: ['financial_year']
      },
      {
        fields: ['assigned_officer_id']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['updated_by']
      }
    ]
  }
);



export default AuditRequest;
