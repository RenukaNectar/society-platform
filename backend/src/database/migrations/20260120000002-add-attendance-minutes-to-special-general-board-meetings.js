'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('special_general_board_meetings');

    if (!table.attendance_sheet_id) {
      await queryInterface.addColumn('special_general_board_meetings', 'attendance_sheet_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!table.minutes_of_meeting_id) {
      await queryInterface.addColumn('special_general_board_meetings', 'minutes_of_meeting_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('special_general_board_meetings');
    if (table.attendance_sheet_id) {
      await queryInterface.removeColumn('special_general_board_meetings', 'attendance_sheet_id');
    }
    if (table.minutes_of_meeting_id) {
      await queryInterface.removeColumn('special_general_board_meetings', 'minutes_of_meeting_id');
    }
  }
};
