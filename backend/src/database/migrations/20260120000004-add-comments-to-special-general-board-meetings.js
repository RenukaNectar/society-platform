'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('special_general_board_meetings');
    if (table.comments) {
      return;
    }
    await queryInterface.addColumn('special_general_board_meetings', 'comments', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('special_general_board_meetings');
    if (table.comments) {
      await queryInterface.removeColumn('special_general_board_meetings', 'comments');
    }
  }
};
