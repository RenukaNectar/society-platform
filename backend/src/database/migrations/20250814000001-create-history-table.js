'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      resource: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Name of the resource/table being tracked'
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type of action (create, update, delete, etc.)'
      },
      comments: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional comments or description of the change'
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID of the record being tracked'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User who created this history record'
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
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this history record is active'
      }
    });

    // Add indexes with error handling
    try {
      await queryInterface.addIndex('history', ['resource']);
    } catch (error) {
      console.log('Index on resource already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('history', ['reference_id']);
    } catch (error) {
      console.log('Index on reference_id already exists, skipping...');
    }

    try {
      await queryInterface.addIndex('history', ['type']);
    } catch (error) {
      console.log('Index on type already exists, skipping...');
    }

    try {
      await queryInterface.addIndex('history', ['created_by']);
    } catch (error) {
      console.log('Index on created_by already exists, skipping...');
    }

    try {
      await queryInterface.addIndex('history', ['active']);
    } catch (error) {
      console.log('Index on active already exists, skipping...');
    }

    try {
      await queryInterface.addIndex('history', ['created_at']);
    } catch (error) {
      console.log('Index on created_at already exists, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('history');
  }
};
