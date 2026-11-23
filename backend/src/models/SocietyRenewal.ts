import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

interface ISocietyRenewal {
  id: string;
  society_id: string;
  challan_url: string | null;
  submit_date: Date | null;
  status: string | null;
  workflow_status: string | null;
  assigned_to_user_id: string | null;
  status_changed_by: string | null;
  status_changed_at: Date | null;
  renewal_certificate_url: string | null;
  certificate_issue_date: Date | null;
  created_by: string | null;
  updated_by: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface ISocietyRenewalCreate {
  society_id: string;
  challan_url?: string | null;
  submit_date?: Date | null;
  status?: string | null;
  workflow_status?: string | null;
  assigned_to_user_id?: string | null;
  status_changed_by?: string | null;
  status_changed_at?: Date | null;
  renewal_certificate_url?: string | null;
  certificate_issue_date?: Date | null;
  created_by?: string | null;
  updated_by?: string | null;
}

class SocietyRenewal extends Model<ISocietyRenewal, ISocietyRenewalCreate> implements ISocietyRenewal {
  public id!: string;
  public society_id!: string;
  public challan_url!: string | null;
  public submit_date!: Date | null;
  public status!: string | null;
  public workflow_status!: string | null;
  public assigned_to_user_id!: string | null;
  public status_changed_by!: string | null;
  public status_changed_at!: Date | null;
  public renewal_certificate_url!: string | null;
  public certificate_issue_date!: Date | null;
  public created_by!: string | null;
  public updated_by!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static associate(models: any) {
    SocietyRenewal.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    SocietyRenewal.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedByUser' });
    SocietyRenewal.belongsTo(models.User, { foreignKey: 'assigned_to_user_id', as: 'assignedToUser' });
    SocietyRenewal.belongsTo(models.User, { foreignKey: 'status_changed_by', as: 'statusChangedByUser' });
    SocietyRenewal.belongsTo(models.Status, { foreignKey: 'status', as: 'statusDetails' });
    SocietyRenewal.belongsTo(models.ModuleWorkflow, { foreignKey: 'workflow_status', as: 'workflowStatus' });
    SocietyRenewal.belongsTo(models.SocietyRegistration, { 
      foreignKey: 'society_id', 
      targetKey: 'id',
      as: 'society' 
    });
  }
}

SocietyRenewal.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    society_id: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    challan_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    submit_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'statuses',
        key: 'id'
      }
    },
    workflow_status: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'module_workflows',
        key: 'id'
      }
    },
    assigned_to_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
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
    renewal_certificate_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    certificate_issue_date: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'society_renewals',
    modelName: 'SocietyRenewal',
    underscored: true,
    timestamps: true
  }
);

export default SocietyRenewal;
