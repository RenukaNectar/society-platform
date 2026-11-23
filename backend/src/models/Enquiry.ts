import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize';
import District from './District';
import SocietyRegistration from './SocietyRegistration';
import Status from './Status';
import User from './user';
import Media from './Media';

interface EnquiryAttributes {
  id: string;
  society_id: string;
  district_id: string;
  applicant_name: string;
  applicant_type: string;
  contact_number: string;
  email_id: string;
  address: string;
  society_registration_number: string;
  society_name: string;
  society_address: string;
  district: string;
  subdivision: string;
  state: string;
  subject: string;
  description: string;
  preferred_office_level: string;
  date_of_incident: Date;
  documents: string;
  previous_reference_number: string;
  status: string;
  status_changed_at: Date;
  status_changed_by: string;
  workflow_status?: string | null;
  assigned_to_user_id?: string | null;
  is_rcs_initiated?: boolean;
  bye_laws?: string | null;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
}   

interface EnquiryCreationAttributes extends Omit<EnquiryAttributes, 'id' | 'created_at' | 'updated_at'> {
    created_at: Date;
    updated_at: Date;
}


class Enquiry extends Model<EnquiryAttributes, EnquiryCreationAttributes> implements EnquiryAttributes {
    public id!: string;
    public society_id!: string;
    public district_id!: string;
    public applicant_name!: string;
    public applicant_type!: string;
    public contact_number!: string;
    public email_id!: string;
    public address!: string;
    public society_registration_number!: string;
    public society_name!: string;
    public society_address!: string;
    public district!: string;
    public subdivision!: string;
    public state!: string;
    public subject!: string;
    public description!: string;
    public preferred_office_level!: string;
    public date_of_incident!: Date;
    public documents!: string;
    public previous_reference_number!: string;
    public status!: string;
    public status_changed_at!: Date;
    public status_changed_by!: string;
    public workflow_status!: string | null;
    public assigned_to_user_id!: string | null;
    public is_rcs_initiated!: boolean;
    public bye_laws!: string | null;
    public created_by!: string;
    public updated_by!: string;
    public created_at!: Date;
    public updated_at!: Date;

    public static associate(models: any) {
        Enquiry.belongsTo(models.SocietyRegistration, { foreignKey: 'society_id', targetKey: 'id', as: 'society' });
        Enquiry.belongsTo(models.District, { foreignKey: 'district_id', targetKey: 'id', as: 'districtInfo' });
        Enquiry.belongsTo(models.Status, { foreignKey: 'status', targetKey: 'id', as: 'statusInfo' });
        Enquiry.belongsTo(models.User, { foreignKey: 'created_by', targetKey: 'id', as: 'createdByUser' });
        Enquiry.belongsTo(models.User, { foreignKey: 'updated_by', targetKey: 'id', as: 'updatedByUser' });
        Enquiry.belongsTo(models.Media, { foreignKey: 'documents', targetKey: 'id', as: 'documentFiles' });
        Enquiry.belongsTo(models.Media, { foreignKey: 'bye_laws', targetKey: 'id', as: 'byeLawsMedia' });
        Enquiry.belongsTo(models.ModuleWorkflow, {
            foreignKey: 'workflow_status',
            targetKey: 'id',
            as: 'workflowStatus'
        });
        Enquiry.belongsTo(models.User, {
            foreignKey: 'assigned_to_user_id',
            targetKey: 'id',
            as: 'assignedToUser'
        });
    }
}

Enquiry.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    society_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'society_registrations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    district_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'districts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    applicant_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    applicant_type: {
        type: DataTypes.ENUM('Member', 'Office Bearer', 'General Public', 'Other'),
        allowNull: true
    },
    contact_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    society_registration_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    society_name: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    society_address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    subdivision: {
        type: DataTypes.STRING,
        allowNull: true
    },
    district: {
        type: DataTypes.STRING,
        allowNull: true
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subject: {
        type: DataTypes.ENUM('Inquiry', 'Inspection', 'Complaint', 'Irregularity', 'Routine Check', 'Other'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    preferred_office_level: {
        type: DataTypes.ENUM('State', 'District', 'Subdivision'),
        allowNull: true
    },
    date_of_incident: {
        type: DataTypes.DATE,
        allowNull: true
    },
    previous_reference_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'statuses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    status_changed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status_changed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    workflow_status: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'module_workflows', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    assigned_to_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    is_rcs_initiated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    documents: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'media', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    bye_laws: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'media', key: 'id' },
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
    }
}, {
    sequelize,
    modelName: 'Enquiry',
    tableName: 'enquiry_requests',
    timestamps: true
});


export default Enquiry;