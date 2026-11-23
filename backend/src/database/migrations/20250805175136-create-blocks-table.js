'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('blocks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      state_code: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      district_code: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      block_code: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      block_name_hindi: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      name_local: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      block_version: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    });

    // Add indexes with error handling
    try {
      await queryInterface.addIndex('blocks', ['state_code']);
    } catch (error) {
      console.log('Index on state_code already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('blocks', ['district_code']);
    } catch (error) {
      console.log('Index on district_code already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('blocks', ['block_code']);
    } catch (error) {
      console.log('Index on block_code already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('blocks', ['name']);
    } catch (error) {
      console.log('Index on name already exists, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('blocks');
  }
};