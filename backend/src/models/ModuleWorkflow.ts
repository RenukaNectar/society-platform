import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import { IModuleWorkflow, IModuleWorkflowCreate } from '../types';

class ModuleWorkflow extends Model<IModuleWorkflow, IModuleWorkflowCreate> implements IModuleWorkflow {
  public id!: string;
  public module_id!: string;
  public sequence!: number;
  public allowed_role_id?: string | string[] | null;
  public approval_status_id?: string | null;
  public approval_notification_template_id?: string | null;
  public approval_send_to?: string | null;
  public approval_documents?: string[] | null;
  public reject_role_id?: string | string[] | null;
  public reject_status_id?: string | null;
  public reject_notification_template_id?: string | null;
  public reject_send_to?: string | null;
  public reject_documents?: string[] | null;
  public assigned_to?: string | string[] | null;
  public is_hq!: boolean;
  public active!: boolean;
  public created_by?: string | null;
  public updated_by?: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static associate(models: any) {
    // ModuleWorkflow belongs to Module (if Module model exists)
    if (models.Module) {
      ModuleWorkflow.belongsTo(models.Module, { foreignKey: 'module_id', as: 'module' });
    }

    // allowed_role_id, reject_role_id, assigned_to are JSON (single role UUID or array) — no FK association

    // ModuleWorkflow belongs to Status (approval)
    ModuleWorkflow.belongsTo(models.Status, { foreignKey: 'approval_status_id', as: 'approvalStatus' });

    // ModuleWorkflow belongs to Status (reject)
    ModuleWorkflow.belongsTo(models.Status, { foreignKey: 'reject_status_id', as: 'rejectStatus' });

    // ModuleWorkflow belongs to NotificationTemplate (approval) - if NotificationTemplate model exists
    if (models.NotificationTemplate) {
      ModuleWorkflow.belongsTo(models.NotificationTemplate, { foreignKey: 'approval_notification_template_id', as: 'approvalNotificationTemplate' });
    }

    // ModuleWorkflow belongs to NotificationTemplate (reject) - if NotificationTemplate model exists
    if (models.NotificationTemplate) {
      ModuleWorkflow.belongsTo(models.NotificationTemplate, { foreignKey: 'reject_notification_template_id', as: 'rejectNotificationTemplate' });
    }

    // ModuleWorkflow belongs to User (created by)
    ModuleWorkflow.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });

    // ModuleWorkflow belongs to User (updated by)
    ModuleWorkflow.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedByUser' });
  }
}

ModuleWorkflow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    module_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Foreign key constraint will be added later when Module model is created
    },
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    allowed_role_id: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Role ID or array of role IDs allowed to act at this step'
    },
    approval_status_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'statuses',
        key: 'id'
      }
    },
    approval_notification_template_id: {
      type: DataTypes.UUID,
      allowNull: true,
      // Foreign key constraint will be added later when NotificationTemplate model is created
    },
    approval_send_to: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['all', 'single']]
      }
    },
    approval_documents: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null
    },
    reject_role_id: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Role ID or array of role IDs for reject routing'
    },
    reject_status_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'statuses',
        key: 'id'
      }
    },
    reject_notification_template_id: {
      type: DataTypes.UUID,
      allowNull: true,
      // Foreign key constraint will be added later when NotificationTemplate model is created
    },
    reject_send_to: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    reject_documents: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null
    },
    assigned_to: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null
    },
    is_hq: {
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
    modelName: 'ModuleWorkflow',
    tableName: 'module_workflows',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['module_id']
      },
      {
        fields: ['module_id', 'sequence']
      },
      {
        fields: ['allowed_role_id']
      },
      {
        fields: ['active']
      },
      {
        fields: ['is_hq']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['assigned_to']
      }
    ],
    hooks: {
      beforeCreate: (moduleWorkflow: ModuleWorkflow) => {
        if (!moduleWorkflow.id) {
          moduleWorkflow.id = require('uuid').v4();
        }
      }
    }
  }
);

export default ModuleWorkflow;
