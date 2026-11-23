import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import DistrictsBlocksGpVillage from './DistrictsBlocksGpVillage';

interface ISocietyRegistration {
  id: string;
  society_id: string;
  cooperative_society_name: string | null;
  local_langauge_society_name: string | null;
  registration_authoritie_id: string | null;
  reference_year: string | number | null;
  date_registration: Date | string | null;
  registration_number: string | null;
  cooperative_society_type_id: string | null;
  area_of_operation_id: string | null;
  water_body_type_id: string | null;
  sector_of_operation_type: string | null;
  sector_of_operation: string | null;
  functional_status: string | null;
  location_of_head_quarter: string | null;
  state_id: string | null;
  district_id: string | null;
  block_id: string | null;
  status: string | null;
  status_changed_by: string | null;
  status_changed_at: Date | string | null;
  workflow_status: string | null;
  assigned_to_user_id: string | null;
  gram_panchayat_id: string | null;
  village_code: string | null;
  urban_local_body_type: string | null;
  urban_local_body_code: string | null;
  locality_ward_code: string | null;
  pincode: string | number | null;
  full_address: string | null;
  contact_person: string | null;
  designation: string | null;
  mobile: string | null;
  landline: string | null;
  email: string | null;
  financial_audit: string | null;
  audit_complete_year: string | number | null;
  category_audit: string | null;
  is_profit_making: string | null;
  annual_turnover: string | number | null;
  annual_profit: string | number | null;
  annual_loss: string | number | null;
  is_msme: boolean | null;
  udyam_no: string | null;
  is_dividend_paid: string | null;
  dividend_rate: string | number | null;
  operation_area_location: string | null;
  bank_type: string | null;
  cooperative_society_bank_id: string | null;
  other_bank: string | null;
  pan_no: string | null;
  gst_no: string | null;
  how_many_branches: string | number | null;
  full_time_secretary: string | null;
  mobile_number_of_secretary: string | number | null;
  created_by: string | null;
  updated_by: string | null;
  bye_laws?: string | null;
  bank_certificate?: string | null;
  economic_scheme?: string | null;
  contributor_list?: string | null;
  custom_documents?: string | null;
  certicficate_date?: Date | string | null;
  certificate_media_id?: string | null;
  notification_media_id?: string | null;
  certificate_issue_date?: Date | string | null;
  non_family_coop_certificate?: string | null;
  site_inspection_report?: string | null;
  circular_minutes_of_meeting?: string | null;
  land_document?: string | null;
  society_type?: string | null;
  challan_receipt?: string | null;
  challan_receipt_at?: Date | string | null;
  catificate_issued_by?: string | null;
  additional_data?: any | null;
  minutes_of_meeting_of_promoters_meeting?: string | null;
  circular_for_promoters_meeting?: string | null;
  full_particulars_of_the_promoter?: string | null;
  ncd_id?: string | null;
  ncd_running_number?: number | null;
  is_affiliated_union_federation?: string | null;
  affiliated_union_level?: string | null;
  affiliated_union_name?: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface ISocietyRegistrationCreate {
  society_id: string;
  cooperative_society_name?: string | null;
  local_langauge_society_name?: string;
  registration_authoritie_id?: string;
  reference_year?: string | number;
  date_registration?: string;
  registration_number?: string;
  cooperative_society_type_id?: string;
  area_of_operation_id?: string;
  water_body_type_id?: string;
  sector_of_operation_type?: string;
  sector_of_operation?: string;
  functional_status?: string;
  location_of_head_quarter?: string;
  state_id?: string;
  district_id?: string;
  block_id?: string;
  status?: string;
  status_changed_by?: string;
  status_changed_at?: Date | string | null;
  workflow_status?: string | null;
  assigned_to_user_id?: string | null;
  gram_panchayat_id?: string;
  village_code?: string;
  urban_local_body_type?: string;
  urban_local_body_code?: string;
  locality_ward_code?: string;
  pincode?: string | number;
  full_address?: string;
  contact_person?: string;
  designation?: string;
  mobile?: string;
  landline?: string;
  email?: string;
  financial_audit: string;
  audit_complete_year?: string | number;
  category_audit?: string;
  is_profit_making: string;
  annual_turnover?: string | number;
  annual_profit?: string | number;
  annual_loss?: string | number;
  is_msme?: boolean | null;
  udyam_no?: string | null;
  is_dividend_paid: string;
  dividend_rate?: string | number;
  operation_area_location?: string;
  bank_type?: string;
  cooperative_society_bank_id?: string;
  other_bank?: string;
  pan_no?: string;
  gst_no?: string;
  how_many_branches?: string | number;
  full_time_secretary?: string;
  mobile_number_of_secretary?: string | number;
  created_by?: string;
  updated_by?: string;
  bye_laws?: string | null;
  bank_certificate?: string | null;
  economic_scheme?: string | null;
  contributor_list?: string | null;
  custom_documents?: string | null;
  certificate_media_id?: string | null;
  notification_media_id?: string | null;
  certificate_issue_date?: Date | string | null;
  non_family_coop_certificate?: string | null;
  site_inspection_report?: string | null;
  circular_minutes_of_meeting?: string | null;
  land_document?: string | null;
  society_type?: string | null;
  challan_receipt?: string | null;
  challan_receipt_at?: Date | string | null;
  catificate_issued_by?: string | null;
  additional_data?: any | null;
  minutes_of_meeting_of_promoters_meeting?: string | null;
  circular_for_promoters_meeting?: string | null;
  full_particulars_of_the_promoter?: string | null;
  ncd_id?: string | null;
  ncd_running_number?: number | null;
  is_affiliated_union_federation?: string | null;
  affiliated_union_level?: string | null;
  affiliated_union_name?: string | null;
}

class SocietyRegistration extends Model<ISocietyRegistration, ISocietyRegistrationCreate> implements ISocietyRegistration {
  public id!: string;
  public society_id!: string;
  public cooperative_society_name!: string | null;
  public local_langauge_society_name!: string | null;
  public registration_authoritie_id!: string | null;
  public reference_year!: string | number | null;
  public date_registration!: Date | string | null;
  public registration_number!: string | null;
  public cooperative_society_type_id!: string | null;
  public area_of_operation_id!: string | null;
  public water_body_type_id!: string | null;
  public sector_of_operation_type!: string | null;
  public sector_of_operation!: string | null;
  public functional_status!: string | null;
  public location_of_head_quarter!: string | null;
  public state_id!: string | null;
  public district_id!: string | null;
  public block_id!: string | null;
  public gram_panchayat_id!: string | null;
  public village_code!: string | null;
  public urban_local_body_type!: string | null;
  public urban_local_body_code!: string | null;
  public locality_ward_code!: string | null;
  public pincode!: string | number | null;
  public full_address!: string | null;
  public contact_person!: string | null;
  public designation!: string | null;
  public mobile!: string | null;
  public landline!: string | null;
  public email!: string | null;
  public financial_audit!: string | null;
  public audit_complete_year!: string | number | null;
  public category_audit!: string | null;
  public is_profit_making!: string | null;
  public annual_turnover!: string | number | null;
  public annual_profit!: string | number | null;
  public annual_loss!: string | number | null;
  public is_msme!: boolean | null;
  public udyam_no!: string | null;
  public is_dividend_paid!: string | null;
  public dividend_rate!: string | number | null;
  public operation_area_location!: string | null;
  public bank_type!: string | null;
  public cooperative_society_bank_id!: string | null;
  public other_bank!: string | null;
  public pan_no!: string | null;
  public gst_no!: string | null;
  public how_many_branches!: string | number | null;
  public full_time_secretary!: string | null;
  public mobile_number_of_secretary!: string | number | null;
  public bye_laws!: string | null;
  public bank_certificate!: string | null;
  public economic_scheme!: string | null;
  public contributor_list!: string | null;
  public custom_documents!: string | null;
  public created_by!: string | null;
  public updated_by!: string | null;
  public status!: string | null;
  public status_changed_by!: string | null;
  public status_changed_at!: Date | string | null;
  public workflow_status!: string | null;
  public assigned_to_user_id!: string | null;
  public certificate_media_id!: string | null;
  public notification_media_id!: string | null;
  public certicficate_date!: Date | string | null;
  public certificate_issue_date!: Date | string | null;
  public non_family_coop_certificate!: string | null;
  public site_inspection_report!: string | null;
  public circular_minutes_of_meeting!: string | null;
  public land_document!: string | null;
  public society_type!: string | null;
  public challan_receipt!: string | null;
  public challan_receipt_at!: Date | string | null;
  public catificate_issued_by!: string | null;
  public additional_data!: any | null;
  public minutes_of_meeting_of_promoters_meeting!: string | null;
  public circular_for_promoters_meeting!: string | null;
  public full_particulars_of_the_promoter!: string | null;
  public ncd_id!: string | null;
  public ncd_running_number!: number | null;
  public is_affiliated_union_federation!: string | null;
  public affiliated_union_level!: string | null;
  public affiliated_union_name!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public createdByUser?: any;
  public updatedByUser?: any;
  // Workflow status properties (added dynamically, not stored in DB)
  public workflowStatus?: {
    current: any;
    next: any;
    previous: any;
    currentStatus: any;
    assignedToRole: { id: string; name: string } | null;
    assignedToUserIds: string[];
    assignedToUserId?: string | null;
    assignedUser?: { id: string; first_name: string; last_name: string; email: string; full_name?: string } | null;
  } | null;
  public state?: any;
  public district?: any;
  public block?: any;
  public waterBodyType?: any;
  public registrationAuthority?: any;
  public cooperativeSocietyType?: any;
  public sectorOfOperation?: any;
  public areaOfOperationLevel?: any;
  public members?: any[];
  public byeLawsMedia?: any;
  public bankCertificateMedia?: any;
  public economicSchemeMedia?: any;
  public contributorListMedia?: any;
  public customDocumentsMedia?: any;
  public statusDetails?: any;
  public amendments?: any[];
  public functionalStatus?: any;
  public certificateMedia?: any;
  public notificationMedia?: any;
  public societyType?: any;
  public minutesOfMeetingOfPromotersMeetingMedia?: any;
  public circularForPromotersMeetingMedia?: any;
  public fullParticularsOfThePromoterMedia?: any;
  public static associate(models: any) {
    SocietyRegistration.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    SocietyRegistration.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedByUser' });
    SocietyRegistration.belongsTo(models.State, { foreignKey: 'state_id', targetKey: 'id', as: 'state' });
    SocietyRegistration.belongsTo(models.District, { foreignKey: 'district_id', targetKey: 'id', as: 'district' });
    SocietyRegistration.belongsTo(models.Block, { foreignKey: 'block_id', targetKey: 'id', as: 'block' });
    SocietyRegistration.belongsTo(models.WaterBodyType, { foreignKey: 'water_body_type_id', targetKey: 'id', as: 'waterBodyType' });
    SocietyRegistration.belongsTo(models.RegistrationAuthority, { foreignKey: 'registration_authoritie_id', targetKey: 'id', as: 'registrationAuthority' });
    SocietyRegistration.belongsTo(models.CooperativeSocietyType, { foreignKey: 'cooperative_society_type_id', targetKey: 'id', as: 'cooperativeSocietyType' });
    SocietyRegistration.belongsTo(models.SectorOfOperation, { foreignKey: 'sector_of_operation', targetKey: 'id', as: 'sectorOfOperation' });
    SocietyRegistration.belongsTo(models.AreaOfOperationLevel, { foreignKey: 'area_of_operation_id', targetKey: 'id', as: 'areaOfOperationLevel' });
    SocietyRegistration.hasMany(models.Member, { foreignKey: 'society_id', sourceKey: 'society_id', as: 'members' });

    // SocietyRegistration model
SocietyRegistration.belongsTo(DistrictsBlocksGpVillage, {
  foreignKey: 'village_code',
  targetKey: 'village_code',
  as: 'village'
});

    // Media associations
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'bye_laws', as: 'byeLawsMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'bank_certificate', as: 'bankCertificateMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'economic_scheme', as: 'economicSchemeMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'contributor_list', as: 'contributorListMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'custom_documents', as: 'customDocumentsMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'minutes_of_meeting_of_promoters_meeting', as: 'minutesOfMeetingOfPromotersMeetingMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'circular_for_promoters_meeting', as: 'circularForPromotersMeetingMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'full_particulars_of_the_promoter', as: 'fullParticularsOfThePromoterMedia' });

    // Status association
    SocietyRegistration.belongsTo(models.Status, { foreignKey: 'status', as: 'statusDetails' });

    // Workflow status association (module workflow current step)
    if (models.ModuleWorkflow) {
      SocietyRegistration.belongsTo(models.ModuleWorkflow, { foreignKey: 'workflow_status', as: 'workflowStatus' });
    }
    SocietyRegistration.belongsTo(models.User, { foreignKey: 'assigned_to_user_id', as: 'assignedToUser' });

    // Amendment association
    SocietyRegistration.hasMany(models.Amendment, { foreignKey: 'society_id', sourceKey: 'society_id', as: 'amendments' });

    // FunctionalStatus association
    SocietyRegistration.belongsTo(models.FunctionalStatus, { foreignKey: 'functional_status', targetKey: 'id', as: 'functionalStatus' });

    // AuditRequest association
    SocietyRegistration.hasMany(models.AuditRequest, { foreignKey: 'society_registration_id', sourceKey: 'id', as: 'auditRequests' });

    // Certificate association
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'certificate_media_id', targetKey: 'id', as: 'certificateMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'notification_media_id', targetKey: 'id', as: 'notificationMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'non_family_coop_certificate', targetKey: 'id', as: 'nonFamilyCoopCertificateMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'site_inspection_report', targetKey: 'id', as: 'siteInspectionReportMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'circular_minutes_of_meeting', targetKey: 'id', as: 'circularMinutesOfMeetingMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'land_document', targetKey: 'id', as: 'landDocumentMedia' });
    SocietyRegistration.belongsTo(models.Media, { foreignKey: 'challan_receipt', targetKey: 'id', as: 'challanReceiptMedia' });
    SocietyRegistration.belongsTo(models.User, { foreignKey: 'catificate_issued_by', targetKey: 'id', as: 'catificateIssuedByUser' });
    SocietyRegistration.belongsTo(models.SocietyType, { foreignKey: 'society_type', targetKey: 'id', as: 'societyType' });
    // SocietyRegistration.belongsTo(models.SectorOfOperation, { foreignKey: 'sector_of_operation', targetKey: 'id', as: 'sectorOfOperation' });
    // SocietyRegistration.belongsTo(models.District, { foreignKey: 'district_id', targetKey: 'id', as: 'district' });

    // GeneralBodyMeeting association
    SocietyRegistration.hasMany(models.GeneralBodyMeeting, { foreignKey: 'society_id', sourceKey: 'society_id', as: 'generalBodyMeetings' });
    SocietyRegistration.hasMany(models.SpecialGeneralBoardMeeting, { foreignKey: 'society_id', sourceKey: 'society_id', as: 'specialGeneralBoardMeetings' });

    // SocietyConversion association (society_conversion.society_id -> society_registrations.id)
    if (models.SocietyConversion) {
      SocietyRegistration.hasMany(models.SocietyConversion, { foreignKey: 'society_id', sourceKey: 'id', as: 'societyConversions' });
    }
    if (models.BusinessActivity) {
      SocietyRegistration.hasMany(models.BusinessActivity, {
        foreignKey: 'society_id',
        sourceKey: 'id',
        as: 'businessActivities',
      });
    }
  }
}

SocietyRegistration.init(
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
    cooperative_society_name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    local_langauge_society_name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    registration_authoritie_id: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    reference_year: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    date_registration: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    registration_number: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    cooperative_society_type_id: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    area_of_operation_id: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    water_body_type_id: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    sector_of_operation_type: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    sector_of_operation: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    functional_status: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    location_of_head_quarter: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    state_id: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    district_id: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    block_id: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    gram_panchayat_id: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    village_code: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    urban_local_body_type: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    urban_local_body_code: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    locality_ward_code: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    pincode: {
      type: DataTypes.STRING(6),
      allowNull: true
    },
    full_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contact_person: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    designation: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    mobile: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    landline: {
      type: DataTypes.STRING(12),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    financial_audit: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    audit_complete_year: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    category_audit: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    is_profit_making: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    annual_turnover: {
      type: DataTypes.DECIMAL(17, 2),
      allowNull: true
    },
    annual_profit: {
      type: DataTypes.DECIMAL(17, 2),
      allowNull: true
    },
    annual_loss: {
      type: DataTypes.DECIMAL(17, 3),
      allowNull: true
    },
    is_msme: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    udyam_no: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    is_dividend_paid: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    dividend_rate: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true
    },
    operation_area_location: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    bank_type: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    cooperative_society_bank_id: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    other_bank: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    pan_no: {
      type: DataTypes.STRING(12),
      allowNull: true
    },
    gst_no: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    how_many_branches: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    full_time_secretary: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    mobile_number_of_secretary: {
      type: DataTypes.STRING(10),
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
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    bye_laws: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    bank_certificate: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    economic_scheme: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    contributor_list: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    custom_documents: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
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
      onDelete: 'SET NULL',
      comment: 'Current status of the society registration (references statuses.id)'
    },
    status_changed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    status_changed_at: {
      type: DataTypes.DATE,
      allowNull: true
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
      comment: 'FK to module_workflows.id (current workflow step)'
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
      comment: 'User to whom this registration is assigned (set when workflow approved with assigned_to)'
    },
    certificate_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    notification_media_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    non_family_coop_certificate: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    site_inspection_report: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    circular_minutes_of_meeting: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    land_document: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    society_type: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    challan_receipt: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    challan_receipt_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    catificate_issued_by: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    additional_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    minutes_of_meeting_of_promoters_meeting: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    circular_for_promoters_meeting: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    full_particulars_of_the_promoter: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    ncd_id: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    ncd_running_number: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_affiliated_union_federation: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Whether society is affiliated to union/federation (e.g. yes/no or 0/1)'
    },
    affiliated_union_level: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Level of affiliated union'
    },
    affiliated_union_name: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Name of affiliated union/federation'
    }
  },
  {
    sequelize,
    tableName: 'society_registrations',
    modelName: 'SocietyRegistration',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['society_id']
      },
      {
        fields: ['registration_number']
      },
      {
        fields: ['state_id']
      },
      {
        fields: ['district_id']
      },
      {
        fields: ['cooperative_society_type_id']
      },
      {
        fields: ['registration_authoritie_id']
      },
      {
        fields: ['water_body_type_id']
      },
      {
        fields: ['sector_of_operation']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['updated_by']
      },
      {
        fields: ['status']
      },
      {
        fields: ['status_changed_by']
      },
      {
        fields: ['assigned_to_user_id']
      },
      {
        fields: ['bye_laws']
      },
      {
        fields: ['bank_certificate']
      },
      {
        fields: ['economic_scheme']
      },
      {
        fields: ['contributor_list']
      },
      {
        fields: ['custom_documents']
      },
      {
        fields: ['certificate_media_id']
      },
      {
        fields: ['notification_media_id']
      },
      {
        fields: ['non_family_coop_certificate']
      },
      {
        fields: ['site_inspection_report']
      },
      {
        fields: ['circular_minutes_of_meeting']
      },
      {
        fields: ['land_document']
      },
      {
        fields: ['challan_receipt']
      },
      {
        fields: ['challan_receipt_at']
      },
      {
        fields: ['catificate_issued_by']
      },
      {
        fields: ['minutes_of_meeting_of_promoters_meeting']
      },
      {
        fields: ['circular_for_promoters_meeting']
      },
      {
        fields: ['full_particulars_of_the_promoter']
      },
      {
        fields: ['ncd_id']
      },
      {
        fields: ['ncd_running_number']
      }
    ]
  }
);

export default SocietyRegistration; 