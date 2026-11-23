'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if notification_templates table exists
    const [tables] = await queryInterface.sequelize.query(
      "SHOW TABLES LIKE 'notification_templates'"
    );
    
    if (tables.length === 0) {
      console.log('notification_templates table does not exist, skipping migration');
      return;
    }

    // Check if column already exists
    const [columns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM notifications LIKE 'notification_template_id'"
    );

    if (columns.length > 0) {
      console.log('notification_template_id column already exists, skipping migration');
      return;
    }

    // Add notification_template_id column to notifications table
    await queryInterface.addColumn('notifications', 'notification_template_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'notification_templates',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'created_by'
    });

    // Add index for better query performance
    try {
      await queryInterface.addIndex('notifications', ['notification_template_id'], {
        name: 'notifications_notification_template_id_idx'
      });
    } catch (error) {
      console.log('Index on notification_template_id already exists or failed, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    try {
      await queryInterface.removeIndex('notifications', 'notifications_notification_template_id_idx');
    } catch (error) {
      console.log('Index removal failed, continuing...');
    }

    // Remove column
    await queryInterface.removeColumn('notifications', 'notification_template_id');
  }
};
