import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

export type ApplicationAssignmentActionType =
  | 'initial_assign'
  | 'reassign'
  | 'workflow_assign'
  | 'returned_on_unavailable';

export interface IApplicationAssignment {
  id: string;
  module_name: string;
  resource_id: string;
  workflow_status_id?: string | null;
  previous_assignee_id?: string | null;
  new_assignee_id: string;
  assigned_by: string;
  action_type: ApplicationAssignmentActionType;
  reason?: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

export type IApplicationAssignmentCreate = Optional<
  IApplicationAssignment,
  'id' | 'workflow_status_id' | 'previous_assignee_id' | 'reason' | 'created_at' | 'updated_at'
>;

class ApplicationAssignment
  extends Model<IApplicationAssignment, IApplicationAssignmentCreate>
  implements IApplicationAssignment
{
  public id!: string;
  public module_name!: string;
  public resource_id!: string;
  public workflow_status_id?: string | null;
  public previous_assignee_id?: string | null;
  public new_assignee_id!: string;
  public assigned_by!: string;
  public action_type!: ApplicationAssignmentActionType;
  public reason?: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public previousAssignee?: any;
  public newAssignee?: any;
  public assignedByUser?: any;
  public workflowStep?: any;

  public static associate(models: any) {
    ApplicationAssignment.belongsTo(models.User, {
      foreignKey: 'previous_assignee_id',
      as: 'previousAssignee'
    });
    ApplicationAssignment.belongsTo(models.User, {
      foreignKey: 'new_assignee_id',
      as: 'newAssignee'
    });
    ApplicationAssignment.belongsTo(models.User, {
      foreignKey: 'assigned_by',
      as: 'assignedByUser'
    });
    if (models.ModuleWorkflow) {
      ApplicationAssignment.belongsTo(models.ModuleWorkflow, {
        foreignKey: 'workflow_status_id',
        as: 'workflowStep'
      });
    }
  }
}

ApplicationAssignment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    module_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    resource_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    workflow_status_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'module_workflows',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    previous_assignee_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    new_assignee_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    assigned_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    action_type: {
      type: DataTypes.ENUM(
        'initial_assign',
        'reassign',
        'workflow_assign',
        'returned_on_unavailable'
      ),
      allowNull: false,
      defaultValue: 'reassign'
    },
    reason: {
      type: DataTypes.TEXT,
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
    modelName: 'ApplicationAssignment',
    tableName: 'application_assignments',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['module_name', 'resource_id'] },
      { fields: ['new_assignee_id'] },
      { fields: ['previous_assignee_id'] },
      { fields: ['assigned_by'] },
      { fields: ['action_type'] },
      { fields: ['created_at'] }
    ]
  }
);

export default ApplicationAssignment;
