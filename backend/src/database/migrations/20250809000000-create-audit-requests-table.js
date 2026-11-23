'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('audit_requests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      
      // Society Information
      society_registration_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'society_registrations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // Financial Year
      financial_year: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Format: YYYY-YY (e.g., 2024-25)'
      },
      
      // Auditor Information
      auditor_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      auditor_registration_number: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      audit_completion_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      audit_classification: {
        type: Sequelize.ENUM('A', 'B', 'C', 'D'),
        allowNull: false,
        comment: 'Audit classification: A, B, C, or D'
      },
      
      // Meeting Details
      agm_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      bod_meeting_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      total_members_on_roll: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      members_attended: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      
      // Financial Information
      turnover: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Annual turnover amount'
      },
      profit_loss: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Profit or loss amount'
      },
      working_capital: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      accumulated_profit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      accumulated_loss: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      audit_fee_paid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      
      // Document Uploads (Media References)
      audit_accounts_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      audit_note_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      vital_stats_form_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      shareholder_list_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      agm_bod_minutes_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      auditor_appointment_letter_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      registration_certificate_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      abstract_closing_stock_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      asset_list_depreciation_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      // Declaration
      declaration_accepted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      
      // Status and Workflow
      status_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'statuses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      submission_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Officer Assignment and Review
      assigned_officer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      officer_review_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Audit Order Details
      audit_order_issued: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      audit_order_number: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      audit_order_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      audit_order_document_path: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      rejection_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Additional Notes
      additional_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // Audit fields
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_requests');
  }
};
