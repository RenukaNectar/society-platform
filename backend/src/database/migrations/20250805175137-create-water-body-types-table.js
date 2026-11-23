'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      await queryInterface.createTable('water_body_types', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING(120),
          allowNull: true
        },
        water_body_types_hindi: {
          type: Sequelize.STRING(120),
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
      console.log('Created water_body_types table');
    } catch (error) {
      console.log('Table water_body_types already exists, skipping creation...');
    }

    // Add indexes with error handling
    try {
      await queryInterface.addIndex('water_body_types', ['name']);
    } catch (error) {
      console.log('Index on name already exists, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('water_body_types');
  }
}; 