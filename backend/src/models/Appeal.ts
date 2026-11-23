import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

interface IAppeal {
  id: string;
  appellant_type: string;
  society_registration_no: string | null;
  name_of_appellant: string;
  contact_phone: string | null;
  contact_email: string | null;
  order_type: string | null;
  specify_order_type: string | null;
  order_number: string | null;
  order_date: Date | string | null;
  grounds_of_appeal: string | null;
  relief_sought: string | null;
  supporting_documents: string | null;
  bye_laws: string | null;
  date_of_filing: Date | string | null;
  e_signed: boolean;
  status: string | null;
  status_updated_at: Date | string | null;
  status_updated_by: string | null;
  district_id?: string | null;
  workflow_status?: string | null;
  assigned_to_user_id?: string | null;
  status_changed_by?: string | null;
  status_changed_at?: Date | string | null;
  created_by: string | null;
  updated_by: string | null;
  active: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface IAppealCreate {
  appellant_type: string;
  name_of_appellant: string;
  society_registration_no?: string;
  contact_phone?: string;
  contact_email?: string;
  order_type?: string;
  specify_order_type?: string;
  order_number?: string;
  order_date?: Date;
  grounds_of_appeal?: string;
  relief_sought?: string;
  supporting_documents?: string;
  bye_laws: string | null;
  date_of_filing?: Date;
  e_signed?: boolean;
  status?: string;
  created_by?: string;
  updated_by?: string;
  status_updated_at?: Date;
  status_updated_by?: string;
  district_id?: string | null;
  workflow_status?: string | null;
  assigned_to_user_id?: string | null;
  status_changed_by?: string | null;
  status_changed_at?: Date | string | null;
  active?: boolean;
}

class Appeal extends Model<IAppeal, IAppealCreate> implements IAppeal {
  public id!: string;
  public appellant_type!: string;
  public society_registration_no!: string | null;
  public name_of_appellant!: string;
  public contact_phone!: string | null;
  public contact_email!: string | null;
  public order_type!: string | null;
  public specify_order_type!: string | null;
  public order_number!: string | null;
  public order_date!: Date | string | null;
  public grounds_of_appeal!: string | null;
  public relief_sought!: string | null;
  public supporting_documents!: string | null;
  public bye_laws!: string | null;
  public date_of_filing!: Date | string | null;
  public e_signed!: boolean;
  public status!: string | null;
  public status_updated_at!: Date | string | null;
  public status_updated_by!: string | null;
  public district_id?: string | null;
  public workflow_status?: string | null;
  public assigned_to_user_id?: string | null;
  public status_changed_by?: string | null;
  public status_changed_at?: Date | string | null;
  public created_by!: string | null;
  public updated_by!: string | null;
  public active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static associate(models: any) {
    Appeal.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    Appeal.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedByUser' });
    Appeal.belongsTo(models.User, { foreignKey: 'status_updated_by', as: 'statusUpdatedByUser' });
    Appeal.belongsTo(models.Media, { foreignKey: 'supporting_documents', as: 'supportingDocumentFile' });
    Appeal.belongsTo(models.Media, { foreignKey: 'bye_laws', as: 'byeLawsMedia' });
    Appeal.belongsTo(models.Status, { foreignKey: 'status', as: 'appealStatus' });

    if (models.District) {
      Appeal.belongsTo(models.District, { foreignKey: 'district_id', as: 'district' });
    }
    if (models.ModuleWorkflow) {
      Appeal.belongsTo(models.ModuleWorkflow, { foreignKey: 'workflow_status', as: 'workflowStatus' });
    }
    Appeal.belongsTo(models.User, { foreignKey: 'assigned_to_user_id', as: 'assignedToUser' });
    Appeal.belongsTo(models.User, { foreignKey: 'status_changed_by', as: 'statusChangedByUser' });
  }
}

Appeal.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    appellant_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    society_registration_no: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name_of_appellant: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contact_phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    order_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    specify_order_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      // Appeals created before this column existed stored the custom value in
      // order_type. Keep their GET responses backward compatible.
      get(this: Appeal): string | null {
        return this.getDataValue('specify_order_type') ?? this.getDataValue('order_type');
      }
    },
    order_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    grounds_of_appeal: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    relief_sought: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    supporting_documents: {
      type: DataTypes.UUID,
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
    date_of_filing: {
      type: DataTypes.DATE,
      allowNull: true
    },
    e_signed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'statuses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    status_updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status_updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    district_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'districts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
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
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'appeals',
    modelName: 'Appeal',
    underscored: true,
    indexes: [
      { fields: ['appellant_type'] },
      { fields: ['status'] },
      { fields: ['created_by'] },
      { fields: ['updated_by'] },
      { fields: ['district_id'] },
      { fields: ['workflow_status'] },
      { fields: ['assigned_to_user_id'] }
    ]
  }
);

export default Appeal;
