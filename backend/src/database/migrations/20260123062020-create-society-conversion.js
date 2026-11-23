'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('society_conversion', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      society_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      
      // mapped from sector of operation table
      conversion_from: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      // mapped from sector of operation table
      conversion_to: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      conversion_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },



      // documents (actual columns, NOT enum)
      notice_sgbm: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      minutes_meeting: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      attendance_sheet: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      form_g: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      bye_laws: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      audit_report: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      // workflow & approval
      status: {
        // draft, pending, approved, rejected from status table identifier
        type: Sequelize.STRING(50),
        allowNull: false
      },

   

      approval_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      approval_remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      certificate_path: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      // system
      created_by: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: true
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      // ACTIVE COLUMN
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('society_conversion');
  },
};
