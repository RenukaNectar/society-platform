'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('members', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    // Add index for is_active column
    try {
      await queryInterface.addIndex('members', ['is_active']);
    } catch (error) {
      console.log('Index on is_active already exists, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('members', 'is_active');
  }
};
