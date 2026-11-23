
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

export default class GeneralBodyMeeting extends Model {
    public id!: string;
    public society_id!: string;
    public society_name!: string;
    public meeting_date!: Date
    public chairman_name!: string | null;
    public total_shareholders!: number
    public attended_shareholders!: number
    public media_id!: string | null;
    public attendance_sheet_id!: string | null;
    public minutes_of_meeting_id!: string | null;
    public notice_id!: string | null;
    public issued_proceedings_document_id!: string | null;
    public bye_laws!: string | null;
    public comments!: string | null;
    public elected_bod_members!: any[] | null;
    public deleted_members!: any[] | null;
    public meeting_type!: string | null;
    public created_by!: string | null;
    public status!: string | null;
    public workflow_status!: string | null;
    public assigned_to_user_id!: string | null;
    public status_changed_by!: string | null;
    public status_changed_at!: Date | null;
    public active!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    // Association properties
    public static associate(models: any) {
        GeneralBodyMeeting.belongsTo(models.SocietyRegistration, { foreignKey: 'society_id', as: 'societyRegistration' });
        GeneralBodyMeeting.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
        GeneralBodyMeeting.belongsTo(models.Media, { foreignKey: 'media_id', as: 'media' });
        GeneralBodyMeeting.belongsTo(models.Media, { foreignKey: 'attendance_sheet_id', as: 'attendanceSheet' });
        GeneralBodyMeeting.belongsTo(models.Media, { foreignKey: 'minutes_of_meeting_id', as: 'minutesOfMeeting' });
        GeneralBodyMeeting.belongsTo(models.Media, { foreignKey: 'notice_id', as: 'notice' });
        GeneralBodyMeeting.belongsTo(models.Media, { foreignKey: 'issued_proceedings_document_id', as: 'issuedProceedingsDocument' });
        GeneralBodyMeeting.belongsTo(models.Media, { foreignKey: 'bye_laws', as: 'byeLawsMedia' });
        GeneralBodyMeeting.belongsTo(models.Status, { foreignKey: 'status', as: 'statusDetails' });
        GeneralBodyMeeting.belongsTo(models.ModuleWorkflow, { foreignKey: 'workflow_status', as: 'workflowStatus' });
        GeneralBodyMeeting.belongsTo(models.User, { foreignKey: 'assigned_to_user_id', as: 'assignedToUser' });
        GeneralBodyMeeting.belongsTo(models.User, { foreignKey: 'status_changed_by', as: 'statusChangedByUser' });
    }
}

GeneralBodyMeeting.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    society_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'society_registrations',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    society_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    meeting_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    chairman_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    total_shareholders: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    attended_shareholders: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    media_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'media',
            key: 'id'
        },
        onDelete: 'SET NULL'

    },
    attendance_sheet_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'media',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    minutes_of_meeting_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'media',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    notice_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'media',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    issued_proceedings_document_id: {
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
    elected_bod_members: {
        type: DataTypes.JSON,
        allowNull: true
    },
    deleted_members: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Shareholders removed via AGM/BOD with deletion reason and supporting document'
    },
    meeting_type: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Meeting module type (AGM or BOD)'
    },
    status: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'statuses',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Current status of the AGM (references statuses.id)'
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
    created_by: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
},
    {
        sequelize,
        tableName: 'general_body_meetings',
        modelName: 'GeneralBodyMeeting',
        timestamps: true,
        underscored: false, // Override global config to use camelCase
        createdAt: 'createdAt', // Explicitly specify column names
        updatedAt: 'updatedAt',
        indexes: [
            {
                fields: ['society_id'],
            },
            {
                fields: ['meeting_date'],
            },
            {
                fields: ['status'],
            },
            {
                fields: ['workflow_status'],
            },
            {
                fields: ['meeting_type'],
            },
            {
                fields: ['assigned_to_user_id'],
            }
        ]
    }
);