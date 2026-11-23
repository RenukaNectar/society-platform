import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/sequelize';


interface IAmendment {
  id: string;
  // Form fields
  chairperson_name: string | null;
  chairperson_address: string | null;
  chairperson_contact: string | null;
  signatory_name: string | null;
  signatory_address: string | null;
  signatory_contact: string | null;
  resolution_extract: string | null;
  general_body_meeting_date: Date | string | null;
  notice_days: number | null;
  notice_date: Date | string | null;
  total_members: number | null;
  quorum_required: number | null;
  members_present: number | null;
  members_voted: number | null;
  votes_in_favour: number | null;
  votes_against: number | null;
  byelaw_number: string | null;
  existing_byelaw: string | null;
  new_proposed_byelaw: string | null;
  existing_byelaw_media_id: string | null;
  new_proposed_byelaw_media_id: string | null;
  bye_laws: string | null;
  amendment_reason: string | null;
  proposed_byelaw_text: string | null;
  additional_data: object | null;
  deleted_members: object[] | null;
  // New fields for amendment requirements
  meeting_notice_agenda_media_id: string | null;
  copy_of_notice_form_g_media_id: string | null;
  district_drcs_arcs_recommendation_media_id: string | null;
  // Optional media columns (only if migrations are applied)
  circular_notice_media_id: string | null;
  minutes_of_meeting_media_id: string | null;
  attendance_sheet_media_id: string | null;
  registration_number_of_previous_application: string | null;
  // Workflow tracking fields
  society_id: string;
  certificate_issue_date: Date | string | null;
  certificate_number: string | null;

  // Audit fields
  created_by: string | null;
  updated_by: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
  status_id: string | null | undefined;
  status_changed_at: Date | string | null;
  status_changed_by: string | null;
  workflow_status: string | null;
  assigned_to_user_id: string | null;

}

interface AmendmentAttributes extends Optional<IAmendment, 'id' | 'created_at' | 'updated_at'> { };

class Amendment extends Model<IAmendment, AmendmentAttributes> implements IAmendment {

  public id!: string;

  // Form fields
  public chairperson_name!: string | null;
  public chairperson_address!: string | null;
  public chairperson_contact!: string | null;
  public signatory_name!: string | null;
  public signatory_address!: string | null;
  public signatory_contact!: string | null;
  public resolution_extract!: string | null;
  public general_body_meeting_date!: Date | string | null;
  public notice_days!: number | null;
  public notice_date!: Date | string | null;
  public total_members!: number | null;
  public quorum_required!: number | null;
  public members_present!: number | null;
  public members_voted!: number | null;
  public votes_in_favour!: number | null;
  public votes_against!: number | null;
  public byelaw_number!: string | null;
  public existing_byelaw!: string | null;
  public new_proposed_byelaw!: string | null;
  public existing_byelaw_media_id!: string | null;
  public new_proposed_byelaw_media_id!: string | null;
  public bye_laws!: string | null;
  public amendment_reason!: string | null;
  public proposed_byelaw_text!: string | null;
  // Optional media columns (only if migrations are applied)
  public circular_notice_media_id!: string | null;
  public minutes_of_meeting_media_id!: string | null;
  public attendance_sheet_media_id!: string | null;
  public registration_number_of_previous_application!: string | null;
  public additional_data!: object | null;
  public deleted_members!: object[] | null;
  // New fields for amendment requirements
  public meeting_notice_agenda_media_id!: string | null;
  public copy_of_notice_form_g_media_id!: string | null;
  public district_drcs_arcs_recommendation_media_id!: string | null;

  // Workflow tracking fields
  public society_id!: string;
  public certificate_issue_date!: Date | string | null;
  public certificate_number!: string | null;

  // Audit fields
  public created_by!: string | null;
  public updated_by!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public status_id!: string | null;
  public status_changed_at!: Date | string | null;
  public status_changed_by!: string | null;
  public workflow_status!: string | null;
  public assigned_to_user_id!: string | null;
  // Associations
  public society?: any;
  public createdByUser?: any;
  public updatedByUser?: any;
  public status?: any;
  public statusChangedByUser?: any;
  public media?: any
  public existingByelawMedia?: any;
  public newProposedByelawMedia?: any;
  public byeLawsMedia?: any;
  public circularNoticeMedia?: any;
  public minutesOfMeetingMedia?: any;
  public attendanceSheetMedia?: any;
  public copyOfNoticeFormGMedia?: any;
  public meetingNoticeAgendaMedia?: any;
  public districtDrcsArcsRecommendationMedia?: any;




  static associate(models: any) {
    Amendment.belongsTo(models.Status, {
      foreignKey: 'status_id',
      as: 'status'
    });
    Amendment.belongsTo(models.SocietyRegistration, {
      foreignKey: 'society_id',
      as: 'society'
    });

    Amendment.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'createdByUser'
    });
    Amendment.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updatedByUser'
    });
    Amendment.belongsTo(models.User, {
      foreignKey: 'status_changed_by',
      as: 'statusChangedByUser'
    });
    Amendment.belongsTo(models.Media, {
      foreignKey: 'existing_byelaw_media_id',
      as: 'existingByelawMedia'
    });
    Amendment.belongsTo(models.Media, {
      foreignKey: 'new_proposed_byelaw_media_id',
      as: 'newProposedByelawMedia'
    });
    Amendment.belongsTo(models.Media, {
      foreignKey: 'bye_laws',
      as: 'byeLawsMedia'
    });
    // Optional media associations (only if migrations are applied)
    Amendment.belongsTo(models.Media, {
      foreignKey: 'circular_notice_media_id',
      as: 'circularNoticeMedia'
    });
    Amendment.belongsTo(models.Media, {
      foreignKey: 'minutes_of_meeting_media_id',
      as: 'minutesOfMeetingMedia'
    });
    Amendment.belongsTo(models.Media, {
      foreignKey: 'attendance_sheet_media_id',
      as: 'attendanceSheetMedia'
    });
    Amendment.belongsTo(models.Media, {
      foreignKey: 'copy_of_notice_form_g_media_id',
      as: 'copyOfNoticeFormGMedia'
    });
    Amendment.belongsTo(models.Media, {
      foreignKey: 'meeting_notice_agenda_media_id',
      as: 'meetingNoticeAgendaMedia'
    });
    Amendment.belongsTo(models.Media, {
      foreignKey: 'district_drcs_arcs_recommendation_media_id',
      as: 'districtDrcsArcsRecommendationMedia'
    });

    if (models.ModuleWorkflow) {
      Amendment.belongsTo(models.ModuleWorkflow, {
        foreignKey: 'workflow_status',
        as: 'workflowStatus'
      });
    }

    Amendment.belongsTo(models.User, {
      foreignKey: 'assigned_to_user_id',
      as: 'assignedToUser'
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

Amendment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    // Form fields
    chairperson_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Name of Chairperson/CEO/President/MD'
    },
    chairperson_address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Address of Chairperson/CEO/President/MD'
    },
    chairperson_contact: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Contact Details of Chairperson/CEO/President/MD'
    },
    signatory_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Name of signatory'
    },
    signatory_address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Address of signatory'
    },
    signatory_contact: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Contact details of signatory'
    },
    resolution_extract: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Extract of the resolution passed for the Byelaw amendment'
    },
    general_body_meeting_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date of General Body Meeting when amendment was discussed'
    },
    notice_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of days notice given to members for the meeting'
    },
    notice_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date of Notice of the General Body Meeting'
    },
    total_members: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Total number of members of the society'
    },
    quorum_required: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quorum required to be present in the meeting'
    },
    members_present: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of members present in the meeting'
    },
    members_voted: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of members who voted in the meeting'
    },
    votes_in_favour: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of members who voted in favour of the resolution'
    },
    votes_against: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of members who voted against the resolution'
    },
    byelaw_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Byelaw number which is to be amended'
    },
    existing_byelaw: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Existing Byelaw to be amended'
    },
    new_proposed_byelaw: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'New Proposed Byelaw'
    },
    existing_byelaw_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Media ID for existing byelaw file'
    },
    new_proposed_byelaw_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Media ID for new proposed byelaw file'
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
    amendment_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for amendment'
    },
    proposed_byelaw_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Text of Proposed Byelaw'
    },

    // Workflow tracking fields
    society_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'societies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    certificate_issue_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    certificate_number: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    // Audit fields
    created_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    updated_by: {
      type: DataTypes.STRING(255),
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
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'statuses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    status_changed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when the status was last changed'
    },
    status_changed_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who last changed the status'
    },
    // Optional media columns (only if migrations are applied)
    circular_notice_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      }
    },
    minutes_of_meeting_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      }
    },
    attendance_sheet_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      }
    },
    registration_number_of_previous_application: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    additional_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional JSON data for amendments'
    },
    deleted_members: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Shareholders removed via amendment with deletion reason and supporting document'
    },
    // New fields for amendment requirements
    meeting_notice_agenda_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Media ID for meeting notice containing the agenda'
    },
    copy_of_notice_form_g_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Media ID for copy of notice in form G'
    },
    district_drcs_arcs_recommendation_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Media ID for recommendation of District DRCS/ARCS'
    },
    workflow_status: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'module_workflows',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK to module_workflows.id (current workflow step for AMENDMENT)'
    },
    assigned_to_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User to whom this amendment is assigned'
    }

  },
  {
    sequelize,
    tableName: 'amendments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    modelName: 'Amendment',
    underscored: true,
  }
);

export default Amendment; 