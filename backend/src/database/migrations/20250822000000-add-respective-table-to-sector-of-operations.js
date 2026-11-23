'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('sector_of_operations', 'respective_table', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'description'
      });
      
      console.log('Successfully added respective_table column to sector_of_operations table');
    } catch (error) {
      console.error('Error adding respective_table column:', error);
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('sector_of_operations', 'respective_table');
      console.log('Successfully removed respective_table column from sector_of_operations table');
    } catch (error) {
      console.error('Error removing respective_table column:', error);
      throw error;
    }
  }
};
