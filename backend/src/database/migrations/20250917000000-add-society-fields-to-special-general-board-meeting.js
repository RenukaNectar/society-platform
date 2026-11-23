'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if society_id column already exists
    const tableDescription = await queryInterface.describeTable('special_general_board_meetings');
    
    if (!tableDescription.society_id) {
      await queryInterface.addColumn('special_general_board_meetings', 'society_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'society_registrations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!tableDescription.society_name) {
      await queryInterface.addColumn('special_general_board_meetings', 'society_name', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('special_general_board_meetings', 'society_name');
    await queryInterface.removeColumn('special_general_board_meetings', 'society_id');
  }
};
