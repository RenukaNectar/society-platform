'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.createTable('appeal_reviews', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },

    appeal_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'appeals',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },

    officer_remarks: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    hearing_date: {
      type: Sequelize.DATE,
      allowNull: true
    },

    // Decision
    status: {
      type: Sequelize.STRING,
      allowNull: true
    },
    final_decision_remarks: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    decision_order: {
      type: Sequelize.UUID, // media_id for PDF
      allowNull: true
    },
    date_of_decision: {
      type: Sequelize.DATE,
      allowNull: true
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
   await queryInterface.dropTable('appeal_reviews');
  }
};
