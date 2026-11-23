
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

// Define the attributes for SpecialGeneralBoardMeeting
interface SpecialGeneralBoardMeetingAttributes {
  id: number;
  society_id?: string;
  society_name?: string;
  notice_id?: string;
  attendance_sheet_id?: string;
  minutes_of_meeting_id?: string;
  bye_laws?: string | null;
  comments?: string;
  total_shareholders: number;
  attended_shareholders: number;
  elected_bod_members?: any[] | null;
  deleted_members?: any[] | null;
  created_by?: string;
  status?: string | null;
  workflow_status?: string | null;
  assigned_to_user_id?: string | null;
  status_changed_by?: string | null;
  status_changed_at?: Date | null;
  meeting_date: Date;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define creation attributes for SpecialGeneralBoardMeeting
interface SpecialGeneralBoardMeetingCreationAttributes extends Optional<SpecialGeneralBoardMeetingAttributes, 'id' | 'active'> { }

// Define the SpecialGeneralBoardMeeting model
export default class SpecialGeneralBoardMeeting extends Model<SpecialGeneralBoardMeetingAttributes, SpecialGeneralBoardMeetingCreationAttributes>
  implements SpecialGeneralBoardMeetingAttributes {
  public id!: number;
  public society_id?: string;
  public society_name?: string;
  public notice_id?: string;
  public attendance_sheet_id?: string;
  public minutes_of_meeting_id?: string;
  public bye_laws!: string | null;
  public comments?: string;
  public total_shareholders!: number;
  public attended_shareholders!: number;
  public elected_bod_members?: any[] | null;
  public deleted_members?: any[] | null;
  public created_by?: string;
  public status?: string | null;
  public workflow_status?: string | null;
  public assigned_to_user_id?: string | null;
  public status_changed_by?: string | null;
  public status_changed_at?: Date | null;
  public meeting_date!: Date;
  public active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public static associate(models: any) {
    SpecialGeneralBoardMeeting.belongsTo(models.SocietyRegistration, { foreignKey: 'society_id', as: 'societyRegistration' });
    SpecialGeneralBoardMeeting.belongsTo(models.Media, { foreignKey: 'notice_id', as: 'notice' });
    SpecialGeneralBoardMeeting.belongsTo(models.Media, { foreignKey: 'attendance_sheet_id', as: 'attendanceSheet' });
    SpecialGeneralBoardMeeting.belongsTo(models.Media, { foreignKey: 'minutes_of_meeting_id', as: 'minutesOfMeeting' });
    SpecialGeneralBoardMeeting.belongsTo(models.Media, { foreignKey: 'bye_laws', as: 'byeLawsMedia' });
    SpecialGeneralBoardMeeting.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    SpecialGeneralBoardMeeting.belongsTo(models.Status, { foreignKey: 'status', as: 'statusDetails' });
    SpecialGeneralBoardMeeting.belongsTo(models.ModuleWorkflow, { foreignKey: 'workflow_status', as: 'workflowStatus' });
    SpecialGeneralBoardMeeting.belongsTo(models.User, { foreignKey: 'assigned_to_user_id', as: 'assignedToUser' });
    SpecialGeneralBoardMeeting.belongsTo(models.User, { foreignKey: 'status_changed_by', as: 'statusChangedByUser' });
  }
}

// Initialize the SpecialGeneralBoardMeeting model
SpecialGeneralBoardMeeting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    society_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'society_registrations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    society_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notice_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    attendance_sheet_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    minutes_of_meeting_id: {
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
    comments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    total_shareholders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    attended_shareholders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    elected_bod_members: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null
    },
    deleted_members: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Shareholders removed via SGBM with deletion reason and supporting document'
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
    status: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'statuses',
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
    meeting_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'special_general_board_meetings',
    modelName: 'SpecialGeneralBoardMeeting',
    underscored: false,
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['meeting_date']
      },
      {
        fields: ['active']
      },
      {
        fields: ['status']
      },
      {
        fields: ['workflow_status']
      },
      {
        fields: ['assigned_to_user_id']
      }
    ]
  }
);