'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      redirect_path: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      data: {
        type: Sequelize.JSON,
        allowNull: true
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Add indexes with error handling
    try {
      await queryInterface.addIndex('notifications', ['created_by']);
    } catch (error) {
      console.log('Index on created_by already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('notifications', ['is_read']);
    } catch (error) {
      console.log('Index on is_read already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('notifications', ['active']);
    } catch (error) {
      console.log('Index on active already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('notifications', ['created_at']);
    } catch (error) {
      console.log('Index on created_at already exists, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
}; 