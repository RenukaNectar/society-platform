'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('annual_forms', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },

       // 1. Financial Year
       financial_year: { type: Sequelize.STRING, allowNull: false },

       // 2. Name of Society
       society_name: { type: Sequelize.STRING, allowNull: false },
 
       // 3. Address
       society_address: { type: Sequelize.TEXT },
 
       // 4. President/CEO/MD/Chairperson contact
       president_name: { type: Sequelize.STRING },
       president_contact: { type: Sequelize.STRING },
 
       // 5. Secretary
       secretary_name: { type: Sequelize.STRING },
       secretary_contact: { type: Sequelize.STRING },
 
       // 6. Registration Number
       registration_number: { type: Sequelize.STRING },
 
       // 7. Registration Date
       registration_date: { type: Sequelize.DATE },
 
       // 8. Type of Society
       society_type: { type: Sequelize.STRING },
 
       // 9. Principal activities/sectors
       principal_activities: { type: Sequelize.TEXT },
 
       // 10. Major activities undertaken
       major_activities: { type: Sequelize.TEXT },
 
       // 11. Area/States of operation
       area_of_operation: { type: Sequelize.STRING },
 
       // 12–15. Members
       total_members: { type: Sequelize.INTEGER, defaultValue: 0 },
       nominal_members: { type: Sequelize.INTEGER, defaultValue: 0 },
       institutional_members: { type: Sequelize.INTEGER, defaultValue: 0 },
       defaulter_members: { type: Sequelize.INTEGER, defaultValue: 0 },
 
       // 16–19. Capital & Deposits
       authorised_share_capital: { type: Sequelize.DECIMAL(15, 2) },
       paid_up_share_capital: { type: Sequelize.DECIMAL(15, 2) },
       total_reserve: { type: Sequelize.DECIMAL(15, 2) },
       deposits: { type: Sequelize.DECIMAL(15, 2) },
 
       // 20–23. Finance
       total_borrowings: { type: Sequelize.DECIMAL(15, 2) },
       working_capital: { type: Sequelize.DECIMAL(15, 2) },
       total_liabilities: { type: Sequelize.DECIMAL(15, 2) },
       total_funds_position: { type: Sequelize.DECIMAL(15, 2) },
 
       // 24–29. Assets
       cash_in_hand: { type: Sequelize.DECIMAL(15, 2) },
       balance_with_banks: { type: Sequelize.DECIMAL(15, 2) },
       investments: { type: Sequelize.DECIMAL(15, 2) },
       fixed_assets: { type: Sequelize.DECIMAL(15, 2) },
       bad_debts: { type: Sequelize.DECIMAL(15, 2) },
       total_assets: { type: Sequelize.DECIMAL(15, 2) },
 
       // 30–32. Loans
       loan_advances: { type: Sequelize.DECIMAL(15, 2) },
       loan_recovered: { type: Sequelize.DECIMAL(15, 2) },
       loan_outstanding: { type: Sequelize.DECIMAL(15, 2) },
 
       // 33–36. Income & Profit
       total_income: { type: Sequelize.DECIMAL(15, 2) },
       total_expenditure: { type: Sequelize.DECIMAL(15, 2) },
       profit: { type: Sequelize.DECIMAL(15, 2) },
       net_profit: { type: Sequelize.DECIMAL(15, 2) },
 
       // 37–38. Purchases/Sales
       total_purchase: { type: Sequelize.DECIMAL(15, 2) },
       total_sale: { type: Sequelize.DECIMAL(15, 2) },
 
       // 39–41. Audit
       audit_upto_year: { type: Sequelize.STRING },
       audit_classification: { type: Sequelize.STRING },
       compliance_audit: { type: Sequelize.STRING },
 
       // 42–43. Elections
       last_election_date: { type: Sequelize.DATE },
       next_election_due_date: { type: Sequelize.DATE },
 
       // 44–45. Committee
       committee_members_count: { type: Sequelize.INTEGER },
       committee_meetings_count: { type: Sequelize.INTEGER },
 
       // 46–47. General Body
       general_body_constitution: { type: Sequelize.STRING },
       last_agm_date: { type: Sequelize.DATE },
 
       // 48–50. Employees
       sanctioned_posts: { type: Sequelize.INTEGER },
       employees_category_wise: { type: Sequelize.TEXT },
       trained_employees: { type: Sequelize.INTEGER },
 
       // 51. Cost of management
       cost_of_management_type: { type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'cost_of_management_types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' },
 
       // 52. Grants/Loans
       grants_received: { type: Sequelize.DECIMAL(15, 2) },
 
       // 53–57. Misappropriation
       misappropriation_nature: { type: Sequelize.STRING },
       misappropriation_level: { type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'misappropriation_levels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' },
       misappropriation_amount: { type: Sequelize.DECIMAL(15, 2) },
       misappropriation_amount_received: { type: Sequelize.DECIMAL(15, 2) },
       misappropriation_status: { type: Sequelize.STRING },
 
       // 58. Arbitration Cases
       arbitration_authority: { type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'arbitration_authorities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' },
 
       // 59–61. Case Status
       cases_pending_start: { type: Sequelize.INTEGER },
       cases_settled: { type: Sequelize.INTEGER },
       cases_pending_end: { type: Sequelize.INTEGER },
 
       // 62–65. Meetings & Audit
       audit_date: { type: Sequelize.DATE },
       balance_sheet: { 
         type: Sequelize.UUID,
         allowNull: true,
         references: {
           model: 'media',
           key: 'id'
         },
         onUpdate: 'CASCADE',
         onDelete: 'SET NULL' 
       },
       surplus_plan: { type: Sequelize.TEXT },
       general_body_meeting_date: { type: Sequelize.DATE },
 
       // 66. Byelaws amendments
       byelaw_amendments: { type: Sequelize.STRING },
 
      society_id: {
        type: Sequelize.STRING(40),
        allowNull: false,
        comment: 'Reference to society_registrations.society_id'
      },

      status: {
        type: Sequelize.UUID,
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
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      status_changed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      }
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('annual_forms');
  }
};
