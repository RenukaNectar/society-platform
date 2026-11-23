'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('members', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      gender: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      society_id: {
        type: Sequelize.STRING(40),
        allowNull: false
        // Note: Foreign key constraint removed as per requirements
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

    // Add indexes with error handling
    try {
      await queryInterface.addIndex('members', ['society_id']);
    } catch (error) {
      console.log('Index on society_id already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('members', ['name']);
    } catch (error) {
      console.log('Index on name already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('members', ['gender']);
    } catch (error) {
      console.log('Index on gender already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('members', ['category']);
    } catch (error) {
      console.log('Index on category already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('members', ['created_by']);
    } catch (error) {
      console.log('Index on created_by already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('members', ['updated_by']);
    } catch (error) {
      console.log('Index on updated_by already exists, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('members');
  }
}; 