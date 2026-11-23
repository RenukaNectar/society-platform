'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('special_general_board_meetings');

    if (!table.total_shareholders) {
      await queryInterface.addColumn('special_general_board_meetings', 'total_shareholders', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!table.attended_shareholders) {
      await queryInterface.addColumn('special_general_board_meetings', 'attended_shareholders', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('special_general_board_meetings');

    if (table.attended_shareholders) {
      await queryInterface.removeColumn('special_general_board_meetings', 'attended_shareholders');
    }

    if (table.total_shareholders) {
      await queryInterface.removeColumn('special_general_board_meetings', 'total_shareholders');
    }
  },
};
