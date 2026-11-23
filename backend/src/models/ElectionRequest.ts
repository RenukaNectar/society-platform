import { Model, DataTypes, Sequelize, Association } from 'sequelize';
import sequelize from '../config/sequelize';
import SocietyRegistration from './SocietyRegistration';
import User from './user';
import Media from './Media';
import Status from './Status';
import District from './District';
import ModuleWorkflow from './ModuleWorkflow';

interface ElectionRequestAttributes {
  id: string;
  society_registration_id: string;
  last_election_held_date: Date | null;
  last_elected_committee_expiry_date: Date | null;
  reason_for_election_request: 'Regular Term' | 'Early Dissolution' | 'Court Order' | 'Other';
  proposed_election_date: Date;
  proposed_venue: string;
  number_of_members_eligible_to_vote: number;
  member_list_media_id?: string;
  meeting_resolution_copy_media_id?: string;
  previous_election_report_media_id?: string;
  bye_laws: string | null;
  status_id: string;
  submission_date?: Date;
  assigned_officer_id?: string;
  officer_review_date?: Date;
  approval_order_issued: boolean;
  approval_order_number?: string;
  approval_order_date?: Date;
  approval_order_document_path?: string;
  rejection_reason?: string;
  rejection_date?: Date;
  additional_notes?: string;
  created_by?: string;
  updated_by?: string;
  district_id?: string | null;
  workflow_status?: string | null;
  assigned_to_user_id?: string | null;
  status_changed_by?: string | null;
  status_changed_at?: Date | null;
  created_at: Date;
  updated_at: Date;
  
  // Association properties
  societyRegistration?: SocietyRegistration;
  createdBy?: User;
  updatedBy?: User;
  assignedOfficer?: User;
  assignedToUser?: User;
  status?: Status;
  district?: District;
  workflowStatus?: ModuleWorkflow;
  memberListMedia?: Media;
  meetingResolutionCopyMedia?: Media;
  previousElectionReportMedia?: Media;
  byeLawsMedia?: Media;
}

interface ElectionRequestCreationAttributes extends Omit<ElectionRequestAttributes, 'id' | 'created_at' | 'updated_at'> {}

class ElectionRequest extends Model<ElectionRequestAttributes, ElectionRequestCreationAttributes> implements ElectionRequestAttributes {
  public id!: string;
  public society_registration_id!: string;
  public last_election_held_date!: Date | null;
  public last_elected_committee_expiry_date!: Date | null;
  public reason_for_election_request!: 'Regular Term' | 'Early Dissolution' | 'Court Order' | 'Other';
  public proposed_election_date!: Date;
  public proposed_venue!: string;
  public number_of_members_eligible_to_vote!: number;
  public member_list_media_id?: string;
  public meeting_resolution_copy_media_id?: string;
  public previous_election_report_media_id?: string;
  public bye_laws!: string | null;
  public status_id!: string;
  public submission_date?: Date;
  public assigned_officer_id?: string;
  public officer_review_date?: Date;
  public approval_order_issued!: boolean;
  public approval_order_number?: string;
  public approval_order_date?: Date;
  public approval_order_document_path?: string;
  public rejection_reason?: string;
  public rejection_date?: Date;
  public additional_notes?: string;
  public created_by?: string;
  public updated_by?: string;
  public district_id?: string | null;
  public workflow_status?: string | null;
  public assigned_to_user_id?: string | null;
  public status_changed_by?: string | null;
  public status_changed_at?: Date | null;
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
  public assignedToUser?: User;
  public status?: Status;
  public district?: District;
  public workflowStatus?: ModuleWorkflow;
  public memberListMedia?: Media;
  public meetingResolutionCopyMedia?: Media;
  public previousElectionReportMedia?: Media;
  public byeLawsMedia?: Media;

  // Associations
  public static override associations: {
    societyRegistration: Association<ElectionRequest, SocietyRegistration>;
    createdBy: Association<ElectionRequest, User>;
    updatedBy: Association<ElectionRequest, User>;
    assignedOfficer: Association<ElectionRequest, User>;
    status: Association<ElectionRequest, Status>;
    memberListMedia: Association<ElectionRequest, Media>;
    meetingResolutionCopyMedia: Association<ElectionRequest, Media>;
    previousElectionReportMedia: Association<ElectionRequest, Media>;
  };

  public static associate(models: any) {
    // Society Registration association
    ElectionRequest.belongsTo(models.SocietyRegistration, { 
      foreignKey: 'society_registration_id', 
      as: 'societyRegistration' 
    });

    // User associations
    ElectionRequest.belongsTo(models.User, { 
      foreignKey: 'created_by', 
      as: 'createdBy' 
    });

    ElectionRequest.belongsTo(models.User, { 
      foreignKey: 'updated_by', 
      as: 'updatedBy' 
    });

    ElectionRequest.belongsTo(models.User, { 
      foreignKey: 'assigned_officer_id', 
      as: 'assignedOfficer' 
    });

    // Status association
    ElectionRequest.belongsTo(models.Status, { 
      foreignKey: 'status_id', 
      as: 'status' 
    });

    // Media associations
    ElectionRequest.belongsTo(models.Media, { 
      foreignKey: 'member_list_media_id', 
      as: 'memberListMedia' 
    });

    ElectionRequest.belongsTo(models.Media, { 
      foreignKey: 'meeting_resolution_copy_media_id', 
      as: 'meetingResolutionCopyMedia' 
    });

    ElectionRequest.belongsTo(models.Media, { 
      foreignKey: 'previous_election_report_media_id', 
      as: 'previousElectionReportMedia' 
    });

    ElectionRequest.belongsTo(models.Media, {
      foreignKey: 'bye_laws',
      as: 'byeLawsMedia'
    });

    // District (used for workflow routing)
    if (models.District) {
      ElectionRequest.belongsTo(models.District, {
        foreignKey: 'district_id',
        as: 'district'
      });
    }

    // Current workflow step
    if (models.ModuleWorkflow) {
      ElectionRequest.belongsTo(models.ModuleWorkflow, {
        foreignKey: 'workflow_status',
        as: 'workflowStatus'
      });
    }

    // User this election request is currently assigned to (set on workflow advance)
    ElectionRequest.belongsTo(models.User, {
      foreignKey: 'assigned_to_user_id',
      as: 'assignedToUser'
    });
    ElectionRequest.belongsTo(models.User, {
      foreignKey: 'status_changed_by',
      as: 'statusChangedByUser'
    });
  }

  // Override toJSON to exclude sensitive fields
  public override toJSON(): any {
    const attributes = { ...this.get() } as any;
    // Keep created_at and updated_at for audit purposes
    // delete attributes.created_at;
    // delete attributes.updated_at;
    return attributes;
  }
}

ElectionRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    society_registration_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'society_registrations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    last_election_held_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    last_elected_committee_expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    reason_for_election_request: {
      type: DataTypes.ENUM('Regular Term', 'Early Dissolution', 'Court Order', 'Other'),
      allowNull: false
    },
    proposed_election_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    proposed_venue: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    number_of_members_eligible_to_vote: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    member_list_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    meeting_resolution_copy_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    previous_election_report_media_id: {
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
    status_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'statuses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    submission_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    assigned_officer_id: {
      type: DataTypes.UUID,
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
    approval_order_issued: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    approval_order_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    approval_order_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approval_order_document_path: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rejection_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    additional_notes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    }
  },
  {
    sequelize,
    tableName: 'election_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default ElectionRequest;
