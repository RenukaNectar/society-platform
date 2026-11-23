import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

interface IAnnualForm {
  id: string;
  society_id: string;
 

  // annual form fields
  financial_year: string;
  cost_of_management_type: string | null;
  arbitration_authority: string | null;
  society_name: string | null;
  society_address: string | null;
  president_name: string | null;
  president_contact: string | null;
  secretary_name: string | null;
  secretary_contact: string | null;
  registration_number: string | null;
  registration_date: Date | string | null;
  society_type: string | null;
  principal_activities: string | null;
  major_activities: string | null;
  area_of_operation: string | null;
  total_members: number | null;
  nominal_members: number | null;
  institutional_members: number | null;
  defaulter_members: number | null;
  authorised_share_capital: number | null;
  paid_up_share_capital: number | null;
  total_reserve: number | null;
  deposits: number | null;
  total_borrowings: number | null;
  working_capital: number | null;
  total_income: number | null;
  total_expenditure: number | null;
  total_assets: number | null;
  total_liabilities: number | null;
  loan_advances: number | null;
  loan_outstanding: number | null;
  loan_recovered: number | null;
  profit: number | null;
  net_profit: number | null;
  
  total_purchase: number | null;
  total_sale: number | null;
  last_agm_date: Date | string | null;
  sanctioned_posts: number | null;
  general_body_constitution: string | null;
  employees_category_wise: string | null;
  trained_employees: number | null;
  audit_upto_year: string | null;
  audit_classification: string | null;
  compliance_audit: string | null;
  total_funds_position: string | null;
  cash_in_hand: number | null;
  balance_with_banks: number | null;
  investments: number | null;
  fixed_assets: number | null;
  bad_debts: number | null;
  last_election_date: Date | string | null;
  next_election_due_date: Date | string | null;
  committee_members_count: number | null;
  committee_meetings_count: number | null;
  
  surplus_plan: string | null;
  general_body_meeting_date: Date | string | null;
  byelaw_amendments: string | null;
  bye_laws: string | null;
  misappropriation_nature: string | null;
  misappropriation_level: string | null;
  misappropriation_amount: number | null;
  misappropriation_amount_received: number | null;
  misappropriation_status: string | null;

  cases_pending_start: number | null;
  cases_settled: number | null;
  cases_pending_end: number | null;
  audit_date: Date | string | null;
  balance_sheet: string | null;
  grants_received: number | null;



// status fields
  status: string | null;
  status_changed_by: string | null;
  status_changed_at: Date | string | null;
  workflow_status: string | null;
  assigned_to_user_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

interface IAnnualFormCreate {
  society_id: string;
  financial_year: string;
  cost_of_management_type: string;
  arbitration_authority: string;
  // annual form fields
  society_name: string;
  society_address: string;
  president_name: string;
  president_contact: string;
  secretary_name: string;
  secretary_contact: string;
  registration_number: string;
  registration_date: Date;
  society_type: string;
  principal_activities: string;
  major_activities: string;
  area_of_operation: string;
  total_members: number;
  nominal_members: number;
  institutional_members: number;
  defaulter_members: number;
  authorised_share_capital: number;
  paid_up_share_capital: number;
  total_reserve: number;
  deposits: number;
  total_borrowings: number;
  working_capital: number;
  total_income: number;
  total_expenditure: number;
  total_assets: number;
  total_liabilities: number;
  surplus_plan?: string | null;
  general_body_meeting_date?: Date | null;
  byelaw_amendments?: string | null;
  bye_laws: string | null;
  misappropriation_nature: string;
  misappropriation_level: string;
  misappropriation_amount: number;
  misappropriation_amount_received: number;
  misappropriation_status: string;
  loan_advances: number;
  loan_outstanding: number;
  loan_recovered: number;

  profit: number;
  net_profit: number;
  total_purchase: number;
  total_sale: number;
  last_agm_date: Date;
  sanctioned_posts: number;
  general_body_constitution: string;
  employees_category_wise: string;
  trained_employees: number;
  audit_upto_year: string;
  audit_classification: string;
  compliance_audit: string;
  cases_pending_start: number;
  cases_settled: number;
  cases_pending_end: number;
  audit_date: Date;
  balance_sheet: string;
  grants_received: number;
  total_funds_position: string;
  cash_in_hand: number;
  balance_with_banks: number;
  investments: number;
  fixed_assets: number;
  bad_debts: number;
  last_election_date: Date;
  next_election_due_date: Date;
  committee_members_count: number;
  committee_meetings_count: number;

  status?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
}

class AnnualForm extends Model<IAnnualForm, IAnnualFormCreate> implements IAnnualForm {
  public next_election_due_date!: Date | string | null;
  public committee_members_count!: number | null;
  public committee_meetings_count!: number | null;

  public id!: string;
  public society_id!: string;
  // annual form fields

  public financial_year!: string;
  public cost_of_management_type!: string | null;
  public misappropriation_level!: string | null;
  public arbitration_authority!: string | null;
  public society_name!: string | null;
  public society_address!: string | null;
  public president_name!: string | null;
  public president_contact!: string | null;
  public secretary_name!: string | null;
  public secretary_contact!: string | null;
  public registration_number!: string | null;
  public registration_date!: Date | string | null;
  public society_type!: string | null;
  public principal_activities!: string | null;
  public major_activities!: string | null;
  public area_of_operation!: string | null;
  public total_members!: number | null;
  public nominal_members!: number | null;
  public institutional_members!: number | null;
  public defaulter_members!: number | null;
  public authorised_share_capital!: number | null;
  public paid_up_share_capital!: number | null;
  public total_reserve!: number | null;
  public deposits!: number | null;
  public total_borrowings!: number | null;
  public working_capital!: number | null;
  public total_income!: number | null;
  public total_expenditure!: number | null;
  public total_assets!: number | null;
  public total_liabilities!: number | null;
  public surplus_plan!: string | null;
  public general_body_meeting_date!: Date | string | null;
  public byelaw_amendments!: string | null;
  public bye_laws!: string | null;
  public misappropriation_nature!: string | null;
  public misappropriation_amount!: number | null;
  public misappropriation_amount_received!: number | null;
  public misappropriation_status!: string | null;
  public loan_advances!: number | null;
  public loan_outstanding!: number | null;
  public loan_recovered!: number | null;
  public profit!: number | null;
  public net_profit!: number | null;
  public total_purchase!: number | null;
  public total_sale!: number | null;
  public last_agm_date!: Date | string | null;
  public sanctioned_posts!: number | null;
  public general_body_constitution!: string | null;
  public employees_category_wise!: string | null;
  public trained_employees!: number | null;
  public audit_upto_year!: string | null;
  public audit_classification!: string | null;
  public compliance_audit!: string | null;
  public total_funds_position!: string | null;
  public cash_in_hand!: number | null;
  public balance_with_banks!: number | null;
  public investments!: number | null;
  public fixed_assets!: number | null;
  public bad_debts!: number | null;
  public last_election_date!: Date | string | null;
  public cases_pending_start!: number | null;
  public cases_settled!: number | null;
  public cases_pending_end!: number | null;
  public audit_date!: Date | string | null;
  public balance_sheet!: string | null;
  public grants_received!: number | null;


  public status!: string | null;
  public status_changed_by!: string | null;
  public status_changed_at!: Date | string | null;
  public workflow_status!: string | null;
  public assigned_to_user_id!: string | null;
  public created_by!: string | null;
  public updated_by!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association properties
  public createdByUser?: any;
  public updatedByUser?: any;
  public statusDetails?: any;
  public costOfManagementType?: any;
  public misappropriationLevel?: any;
  public arbitrationAuthority?: any;
  public society?: any;

  public static associate(models: any) {
    console.log('Setting up AnnualForm associations');
    
    // User associations
    AnnualForm.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdByUser' });
    AnnualForm.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedByUser' });
    AnnualForm.belongsTo(models.User, { foreignKey: 'status_changed_by', as: 'statusChangedByUser' });
    
    // Status association
    AnnualForm.belongsTo(models.Status, { foreignKey: 'status', as: 'statusDetails' });
    
   
    // Society association
    AnnualForm.belongsTo(models.SocietyRegistration, { foreignKey: 'society_id', as: 'society' });
    AnnualForm.belongsTo(models.CostOfManagementType, { foreignKey: 'cost_of_management_type', as: 'costOfManagementTypeAnnualForms' });
    AnnualForm.belongsTo(models.MisappropriationLevel, { foreignKey: 'misappropriation_level', as: 'misappropriationLevelAnnualForms' });
    AnnualForm.belongsTo(models.ArbitrationAuthority, { foreignKey: 'arbitration_authority', as: 'arbitrationAuthorityAnnualForms' });
    AnnualForm.belongsTo(models.Media, { foreignKey: 'balance_sheet', as: 'balanceSheetAnnualForms' });
    AnnualForm.belongsTo(models.Media, { foreignKey: 'general_body_constitution', as: 'generalBodyConstitutionAnnualForms' });
    AnnualForm.belongsTo(models.Media, { foreignKey: 'byelaw_amendments', as: 'byelawAmendmentsAnnualForms' });
    AnnualForm.belongsTo(models.Media, { foreignKey: 'bye_laws', as: 'byeLawsMedia' });
    AnnualForm.belongsTo(models.Media, { foreignKey: 'surplus_plan', as: 'surplusPlanAnnualForms' });

    if (models.ModuleWorkflow) {
      AnnualForm.belongsTo(models.ModuleWorkflow, {
        foreignKey: 'workflow_status',
        as: 'workflowStatus'
      });
    }

    AnnualForm.belongsTo(models.User, {
      foreignKey: 'assigned_to_user_id',
      as: 'assignedToUser'
    });
  }
}

AnnualForm.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    society_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    society_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    president_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    president_contact: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    secretary_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    secretary_contact: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    registration_number: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    registration_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    society_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    principal_activities: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    major_activities: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    area_of_operation: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    total_members: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    nominal_members: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    institutional_members: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    defaulter_members: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    authorised_share_capital: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    paid_up_share_capital: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    loan_advances: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    loan_outstanding: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    loan_recovered: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    profit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    net_profit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    total_purchase: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    total_sale: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    last_agm_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sanctioned_posts: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    general_body_constitution: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    employees_category_wise: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    trained_employees: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    audit_upto_year: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    audit_classification: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    compliance_audit: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    total_reserve: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    deposits: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    total_borrowings: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    working_capital: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    total_income: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    total_expenditure: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    total_assets: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    total_liabilities: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    surplus_plan: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    general_body_meeting_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    byelaw_amendments: {
      type: DataTypes.TEXT,
      allowNull: true
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
    },
    misappropriation_nature: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    misappropriation_level: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'misappropriation_levels',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    misappropriation_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    misappropriation_amount_received: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    misappropriation_status: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    arbitration_authority: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'arbitration_authorities',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    cases_pending_start: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cases_settled: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cases_pending_end: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    audit_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    balance_sheet: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    grants_received: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    // society fields 
    society_id: {
      type: DataTypes.STRING(40),
      allowNull: false,
      comment: 'Reference to society_registrations.society_id'
    },
    financial_year: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'Format: YYYY-YY (e.g., 2024-25)'
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
      comment: 'Current status of the annual form (references statuses.id)'
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
    cost_of_management_type: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'cost_of_management_types',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    total_funds_position: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    cash_in_hand: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    balance_with_banks: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    investments: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    fixed_assets: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    bad_debts: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    last_election_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    next_election_due_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    committee_members_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    committee_meetings_count: {
      type: DataTypes.INTEGER,
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
      comment: 'FK to module_workflows.id (current workflow step for ANNUAL_FILING)'
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
      comment: 'User to whom this annual form is assigned'
    },
  },
  {
    sequelize,
    tableName: 'annual_forms',
    modelName: 'AnnualForm',
    underscored: true,
    indexes: [
      {
        fields: ['society_id']
      },
      {
        fields: ['financial_year']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['updated_by']
      },
      {
        fields: ['cost_of_management_type']
      },
      {
        fields: ['misappropriation_level']
      },
      {
        fields: ['arbitration_authority']
      }
    ]
  }
);

export default AnnualForm;
