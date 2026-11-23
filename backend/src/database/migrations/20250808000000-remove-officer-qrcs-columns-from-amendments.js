'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove officer and qrcs related columns from amendments table if they exist
    const tableDescription = await queryInterface.describeTable('amendments');
    
    if (tableDescription.officer_comments) {
      await queryInterface.removeColumn('amendments', 'officer_comments');
    }
    if (tableDescription.officer_review_date) {
      await queryInterface.removeColumn('amendments', 'officer_review_date');
    }
    if (tableDescription.officer_id) {
      await queryInterface.removeColumn('amendments', 'officer_id');
    }
    if (tableDescription.qrcs_id) {
      await queryInterface.removeColumn('amendments', 'qrcs_id');
    }
    if (tableDescription.qrcs_comments) {
      await queryInterface.removeColumn('amendments', 'qrcs_comments');
    }
    if (tableDescription.qrcs_review_date) {
      await queryInterface.removeColumn('amendments', 'qrcs_review_date');
    }
  },

  async down (queryInterface, Sequelize) {
    // Add back the removed columns in case of rollback
    const tableDescription = await queryInterface.describeTable('amendments');
    
    if (!tableDescription.officer_comments) {
      await queryInterface.addColumn('amendments', 'officer_comments', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    if (!tableDescription.officer_review_date) {
      await queryInterface.addColumn('amendments', 'officer_review_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    if (!tableDescription.officer_id) {
      await queryInterface.addColumn('amendments', 'officer_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
    if (!tableDescription.qrcs_id) {
      await queryInterface.addColumn('amendments', 'qrcs_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
    if (!tableDescription.qrcs_comments) {
      await queryInterface.addColumn('amendments', 'qrcs_comments', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    if (!tableDescription.qrcs_review_date) {
      await queryInterface.addColumn('amendments', 'qrcs_review_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  }
};
