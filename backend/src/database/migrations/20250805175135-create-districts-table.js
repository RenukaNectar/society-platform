'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('districts', {
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
      name: {
        type: Sequelize.STRING(100),
        allowNull: true
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
      await queryInterface.addIndex('districts', ['state_code']);
    } catch (error) {
      console.log('Index on state_code already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('districts', ['district_code']);
    } catch (error) {
      console.log('Index on district_code already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('districts', ['name']);
    } catch (error) {
      console.log('Index on name already exists, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('districts');
  }
};
