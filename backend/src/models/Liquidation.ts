import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface ILiquidation {
  id: string;
  
  // 1. Basic Society Information
  society_id: string;
  society_registration_number: string;
  society_name: string;
  society_type: string;
  address: string | null;
  date_of_original_registration: Date | string | null;
  date_of_minutes_meeting: Date | string | null;
  minutes_meeting_media_id: string | null;
  attendance_sheet_media_id: string | null;
  date_of_circular_notice: Date | string | null;
  circular_notice_media_id: string | null;

  // 2. Liquidation Order Details
  liquidation_order_number: string | null;
  date_of_liquidation_order: Date | string | null;
  mode_of_liquidation: 'voluntary' | 'compulsory';
  reason_for_liquidation: string | null;

  // 3. Financial Position
  total_assets: number | null;
  total_liabilities: number | null;
  net_position: number | null;
  share_capital_paid_up: number | null;
  reserve_funds: number | null;
  creditors_list_media_id: string | null;
  members_list_media_id: string | null;

  // System Fields
  status: string | null;
  liquidation_person: string | null;
  created_by: string | null;
  workflow_status: string | null;
  assigned_to_user_id: string | null;
  status_changed_by: string | null;
  status_changed_at: Date | string | null;
  /** 1 = applicant workflow (society files); 0 = RCS workflow (RCS office initiates) */
  is_applicant: boolean;
  /** JT RCS rcs_observations / RCS-stamped bye-law document (FK to media.id) */
  bye_laws?: string | null;
  /** RCS observations uploaded for liquidator appointment, stamped on RCS approval */
  liquidator_appointment_observations?: string | null;
  /** JT RCS uploads signed on final RCS approval, excluding other_documents */
  rcs_signed_documents?: Array<{
    key: string;
    sequence: number;
    sourceMediaId: string;
    issuedMediaId: string;
    stamped: boolean;
  }> | null;
  active: boolean;

  // Audit fields
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface LiquidationAttributes extends Optional<ILiquidation, 'id'> { }

class Liquidation extends Model<ILiquidation, LiquidationAttributes> implements ILiquidation {
  public id!: string;
  
  // 1. Basic Society Information
  public society_id!: string;
  public society_registration_number!: string;
  public society_name!: string;
  public society_type!: string;
  public address!: string | null;
  public date_of_original_registration!: Date | string | null;
  public date_of_minutes_meeting!: Date | string | null;
  public minutes_meeting_media_id!: string | null;
  public attendance_sheet_media_id!: string | null;
  public date_of_circular_notice!: Date | string | null;
  public circular_notice_media_id!: string | null;

  // 2. Liquidation Order Details
  public liquidation_order_number!: string | null;
  public date_of_liquidation_order!: Date | string | null;
  public mode_of_liquidation!: 'voluntary' | 'compulsory';
  public reason_for_liquidation!: string | null;

  // 3. Financial Position
  public total_assets!: number | null;
  public total_liabilities!: number | null;
  public net_position!: number | null;
  public share_capital_paid_up!: number | null;
  public reserve_funds!: number | null;
  public creditors_list_media_id!: string | null;
  public members_list_media_id!: string | null;

  // System Fields
  public status!: string | null;
  public liquidation_person!: string | null;
  public created_by!: string | null;
  public workflow_status!: string | null;
  public assigned_to_user_id!: string | null;
  public status_changed_by!: string | null;
  public status_changed_at!: Date | string | null;
  public is_applicant!: boolean;
  public bye_laws!: string | null;
  public liquidator_appointment_observations!: string | null;
  public rcs_signed_documents!: Array<{
    key: string;
    sequence: number;
    sourceMediaId: string;
    issuedMediaId: string;
    stamped: boolean;
  }> | null;
  public active!: boolean;

  // Audit fields
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public society?: any;
  public createdByUser?: any;
  public statusObj?: any;
  public societyType?: any;
  public workflowStatus?: any;
  public assignedToUser?: any;
  public minutesMeetingMedia?: any;
  public attendanceSheetMedia?: any;
  public circularNoticeMedia?: any;
  public creditorsListMedia?: any;
  public membersListMedia?: any;
  public byeLawsMedia?: any;
  public liquidatorAppointmentObservationsMedia?: any;

  static associate(models: any) {
    Liquidation.belongsTo(models.SocietyRegistration, {
      foreignKey: 'society_id',
      as: 'society'
    });

    Liquidation.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'createdByUser'
    });

    Liquidation.belongsTo(models.Status, {
      foreignKey: 'status',
      as: 'statusObj'
    });

    Liquidation.belongsTo(models.SocietyType, {
      foreignKey: 'society_type',
      as: 'societyType'
    });

    Liquidation.belongsTo(models.ModuleWorkflow, {
      foreignKey: 'workflow_status',
      as: 'workflowStatus'
    });

    Liquidation.belongsTo(models.User, {
      foreignKey: 'assigned_to_user_id',
      as: 'assignedToUser'
    });

    Liquidation.belongsTo(models.User, {
      foreignKey: 'status_changed_by',
      as: 'statusChangedByUser'
    });

    Liquidation.belongsTo(models.Media, {
      foreignKey: 'minutes_meeting_media_id',
      as: 'minutesMeetingMedia'
    });

    Liquidation.belongsTo(models.Media, {
      foreignKey: 'attendance_sheet_media_id',
      as: 'attendanceSheetMedia'
    });

    Liquidation.belongsTo(models.Media, {
      foreignKey: 'circular_notice_media_id',
      as: 'circularNoticeMedia'
    });

    Liquidation.belongsTo(models.Media, {
      foreignKey: 'creditors_list_media_id',
      as: 'creditorsListMedia'
    });

    Liquidation.belongsTo(models.Media, {
      foreignKey: 'members_list_media_id',
      as: 'membersListMedia'
    });

    Liquidation.belongsTo(models.Media, {
      foreignKey: 'bye_laws',
      as: 'byeLawsMedia'
    });

    Liquidation.belongsTo(models.Media, {
      foreignKey: 'liquidator_appointment_observations',
      as: 'liquidatorAppointmentObservationsMedia'
    });
  }

  override toJSON() {
    const attributes: any = { ...this.get() };
    // Ensure created_at and updated_at are properly set
    if (attributes.created_at) {
      attributes.created_at = attributes.created_at;
    }
    if (attributes.updated_at) {
      attributes.updated_at = attributes.updated_at;
    }
    return attributes;
  }
}

Liquidation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    
    // 1. Basic Society Information
    society_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'society_registrations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    society_registration_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    society_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    society_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    date_of_original_registration: {
      type: DataTypes.DATE,
      allowNull: true
    },
    date_of_minutes_meeting: {
      type: DataTypes.DATE,
      allowNull: true
    },
    minutes_meeting_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'media', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    attendance_sheet_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'media', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    date_of_circular_notice: {
      type: DataTypes.DATE,
      allowNull: true
    },
    circular_notice_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'media', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },

    // 2. Liquidation Order Details
    liquidation_order_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    date_of_liquidation_order: {
      type: DataTypes.DATE,
      allowNull: true
    },
    mode_of_liquidation: {
      type: DataTypes.ENUM('voluntary', 'compulsory'),
      allowNull: false
    },
    reason_for_liquidation: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // 3. Financial Position
    total_assets: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    total_liabilities: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    net_position: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    share_capital_paid_up: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    reserve_funds: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    creditors_list_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'media', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    members_list_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'media', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },

    // System Fields
    status: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'statuses', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    liquidation_person: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'liquidation_persons', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    workflow_status: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'module_workflows', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK to module_workflows.id (current workflow step)'
    },
    assigned_to_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User to whom this liquidation is assigned (set when workflow approved with assigned_to)'
    },
    status_changed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    status_changed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_applicant: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '1 = applicant workflow (society files); 0 = RCS workflow (RCS office initiates)'
    },
    bye_laws: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'media', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'JT RCS rcs_observations / RCS-stamped document (FK to media.id)'
    },
    liquidator_appointment_observations: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'media', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'RCS observations for liquidator appointment, QR-stamped on RCS approval'
    },
    rcs_signed_documents: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JT RCS uploads signed on final RCS approval, excluding other_documents'
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
  },
  {
    sequelize,
    tableName: 'liquidations',
    timestamps: false
  }
);

export default Liquidation;
