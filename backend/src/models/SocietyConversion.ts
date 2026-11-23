import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface ISocietyConversion {
  id: string;
  society_id: string;
  conversion_from: string; // UUID from sector_of_operations table
  conversion_to: string; // UUID from sector_of_operations table
  conversion_reason: string | null;
  notice_sgbm: string | null;
  minutes_meeting: string | null;
  attendance_sheet: string | null;
  form_g: string | null;
  bye_laws: string | null;
  audit_report: string | null;
  status: string;
  approval_date: Date | string | null;
  approval_remarks: string | null;
  reject_reason: string | null;
  certificate_path: string | null;
  certificate: string | null;
  data: any | null;
  created_by: string | null;
  is_active: boolean;
  workflow_status?: string | null;
  assigned_to_user_id?: string | null;
  status_changed_by?: string | null;
  status_changed_at?: Date | string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface SocietyConversionAttributes extends Optional<ISocietyConversion, 'id' | 'created_at' | 'updated_at'> { }

class SocietyConversion extends Model<ISocietyConversion, SocietyConversionAttributes> implements ISocietyConversion {
  public id!: string;
  public society_id!: string;
  public conversion_from!: string;
  public conversion_to!: string;
  public conversion_reason!: string | null;
  public notice_sgbm!: string | null;
  public minutes_meeting!: string | null;
  public attendance_sheet!: string | null;
  public form_g!: string | null;
  public bye_laws!: string | null;
  public audit_report!: string | null;
  public status!: string;
  public approval_date!: Date | string | null;
  public approval_remarks!: string | null;
  public reject_reason!: string | null;
  public certificate_path!: string | null;
  public certificate!: string | null;
  public data!: any | null;
  public created_by!: string | null;
  public is_active!: boolean;
  public workflow_status?: string | null;
  public assigned_to_user_id?: string | null;
  public status_changed_by?: string | null;
  public status_changed_at?: Date | string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public society?: any;
  public statusDetails?: any;
  public conversionFrom?: any; // SectorOfOperation
  public conversionTo?: any; // SectorOfOperation
  public noticeSgbmMedia?: any; // Media
  public minutesMeetingMedia?: any; // Media
  public attendanceSheetMedia?: any; // Media
  public formGMedia?: any; // Media
  public byeLawsMedia?: any; // Media
  public auditReportMedia?: any; // Media
  public certificateMedia?: any; // Media

  public static associate(models: any) {
    SocietyConversion.belongsTo(models.SocietyRegistration, {
      foreignKey: 'society_id',
      targetKey: 'id',
      as: 'society'
    });
    SocietyConversion.belongsTo(models.Status, {
      foreignKey: 'status',
      targetKey: 'id',
      as: 'statusDetails'
    });
    SocietyConversion.belongsTo(models.User, {
      foreignKey: 'created_by',
      targetKey: 'id',
      as: 'createdByUser'
    });
    SocietyConversion.belongsTo(models.SectorOfOperation, {
      foreignKey: 'conversion_from',
      targetKey: 'id',
      as: 'conversionFrom'
    });
    SocietyConversion.belongsTo(models.SectorOfOperation, {
      foreignKey: 'conversion_to',
      targetKey: 'id',
      as: 'conversionTo'
    });
    // Media associations
    SocietyConversion.belongsTo(models.Media, {
      foreignKey: 'notice_sgbm',
      targetKey: 'id',
      as: 'noticeSgbmMedia'
    });
    SocietyConversion.belongsTo(models.Media, {
      foreignKey: 'minutes_meeting',
      targetKey: 'id',
      as: 'minutesMeetingMedia'
    });
    SocietyConversion.belongsTo(models.Media, {
      foreignKey: 'attendance_sheet',
      targetKey: 'id',
      as: 'attendanceSheetMedia'
    });
    SocietyConversion.belongsTo(models.Media, {
      foreignKey: 'form_g',
      targetKey: 'id',
      as: 'formGMedia'
    });
    SocietyConversion.belongsTo(models.Media, {
      foreignKey: 'bye_laws',
      targetKey: 'id',
      as: 'byeLawsMedia'
    });
    SocietyConversion.belongsTo(models.Media, {
      foreignKey: 'audit_report',
      targetKey: 'id',
      as: 'auditReportMedia'
    });
    SocietyConversion.belongsTo(models.Media, {
      foreignKey: 'certificate',
      targetKey: 'id',
      as: 'certificateMedia'
    });
    if (models.User) {
      SocietyConversion.belongsTo(models.User, {
        foreignKey: 'assigned_to_user_id',
        as: 'assignedToUser'
      });
      SocietyConversion.belongsTo(models.User, {
        foreignKey: 'status_changed_by',
        as: 'statusChangedByUser'
      });
    }
    if (models.ModuleWorkflow) {
      SocietyConversion.belongsTo(models.ModuleWorkflow, {
        foreignKey: 'workflow_status',
        as: 'workflowStatus'
      });
    }
  }
}

SocietyConversion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    society_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    conversion_from: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sector_of_operations',
        key: 'id'
      }
    },
    conversion_to: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sector_of_operations',
        key: 'id'
      }
    },
    conversion_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notice_sgbm: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    minutes_meeting: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    attendance_sheet: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    form_g: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    },
    audit_report: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'statuses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    approval_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approval_remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reject_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    certificate_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    certificate: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    workflow_status: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    assigned_to_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
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
    }
  },
  {
    sequelize,
    tableName: 'society_conversion',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default SocietyConversion;
