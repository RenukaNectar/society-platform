'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('appeals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },

      // Appellant Info
      appellant_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      society_registration_no: {
        type: Sequelize.STRING,
        allowNull: true
      },
      name_of_appellant: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contact_phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: true
      },

      // Order Details
      order_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      order_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      order_date: {
        type: Sequelize.DATE,
        allowNull: true
      },

      // Appeal Content
      grounds_of_appeal: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      relief_sought: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      // Supporting docs
      supporting_documents: {
        type: Sequelize.UUID,
        allowNull: true
      },

      date_of_filing: {
        type: Sequelize.DATE,
        allowNull: true
      },

      // Status tracking
      e_signed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status_updated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status_updated_by: {
        type: Sequelize.UUID,
        allowNull: true
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('appeals');
  }
};
