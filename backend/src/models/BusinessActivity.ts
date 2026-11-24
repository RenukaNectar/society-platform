import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

export interface IBusinessActivity {
  id: string;
  society_id: string;
  sector_of_operation: string | null;
  title: string | null;
  additional_data: Record<string, unknown> | null;
  is_primary: boolean;
  is_active: boolean;
  status_id: string | null;
  workflow_status: string | null;
  assigned_to_user_id: string | null;
  status_changed_by: string | null;
  status_changed_at: Date | string | null;
  reject_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

export interface IBusinessActivityCreate {
  society_id: string;
  sector_of_operation?: string | null;
  title?: string | null;
  additional_data?: Record<string, unknown> | null;
  is_primary?: boolean;
  is_active?: boolean;
  status_id?: string | null;
  workflow_status?: string | null;
  assigned_to_user_id?: string | null;
  status_changed_by?: string | null;
  status_changed_at?: Date | string | null;
  reject_reason?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
}

class BusinessActivity
  extends Model<IBusinessActivity, IBusinessActivityCreate>
  implements IBusinessActivity
{
  public id!: string;
  public society_id!: string;
  public sector_of_operation!: string | null;
  public title!: string | null;
  public additional_data!: Record<string, unknown> | null;
  public is_primary!: boolean;
  public is_active!: boolean;
  public status_id!: string | null;
  public workflow_status!: string | null;
  public assigned_to_user_id!: string | null;
  public status_changed_by!: string | null;
  public status_changed_at!: Date | string | null;
  public reject_reason!: string | null;
  public created_by!: string | null;
  public updated_by!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public society?: unknown;
  public sectorOfOperation?: unknown;
  public statusDetails?: unknown;
  public workflowStatus?: unknown;
  public assignedToUser?: unknown;
  public statusChangedByUser?: unknown;

  public static associate(models: any) {
    BusinessActivity.belongsTo(models.SocietyRegistration, {
      foreignKey: 'society_id',
      targetKey: 'id',
      as: 'society',
    });
    BusinessActivity.belongsTo(models.SectorOfOperation, {
      foreignKey: 'sector_of_operation',
      targetKey: 'id',
      as: 'sectorOfOperation',
    });
    BusinessActivity.belongsTo(models.User, {
      foreignKey: 'created_by',
      targetKey: 'id',
      as: 'createdByUser',
    });
    BusinessActivity.belongsTo(models.User, {
      foreignKey: 'updated_by',
      targetKey: 'id',
      as: 'updatedByUser',
    });
    BusinessActivity.belongsTo(models.Status, {
      foreignKey: 'status_id',
      targetKey: 'id',
      as: 'statusDetails',
    });
    BusinessActivity.belongsTo(models.User, {
      foreignKey: 'assigned_to_user_id',
      targetKey: 'id',
      as: 'assignedToUser',
    });
    BusinessActivity.belongsTo(models.User, {
      foreignKey: 'status_changed_by',
      targetKey: 'id',
      as: 'statusChangedByUser',
    });
    if (models.ModuleWorkflow) {
      BusinessActivity.belongsTo(models.ModuleWorkflow, {
        foreignKey: 'workflow_status',
        targetKey: 'id',
        as: 'workflowStatus',
      });
    }
  }
}

BusinessActivity.init(
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
    sector_of_operation: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    additional_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status_id: {
      type: DataTypes.UUID,
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
    },
    status_changed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reject_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'business_activities',
    modelName: 'BusinessActivity',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default BusinessActivity;
