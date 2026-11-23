'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Modify the created_by column to allow null values
    await queryInterface.changeColumn('notifications', 'created_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert the created_by column to not allow null values
    await queryInterface.changeColumn('notifications', 'created_by', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    });
  }
}; 