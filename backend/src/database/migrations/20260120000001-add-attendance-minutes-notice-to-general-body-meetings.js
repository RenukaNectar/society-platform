'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('general_body_meetings');

    if (!table.attendance_sheet_id) {
      await queryInterface.addColumn('general_body_meetings', 'attendance_sheet_id', {
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
      await queryInterface.addColumn('general_body_meetings', 'minutes_of_meeting_id', {
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

    if (!table.notice_id) {
      await queryInterface.addColumn('general_body_meetings', 'notice_id', {
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
    const table = await queryInterface.describeTable('general_body_meetings');
    if (table.attendance_sheet_id) {
      await queryInterface.removeColumn('general_body_meetings', 'attendance_sheet_id');
    }
    if (table.minutes_of_meeting_id) {
      await queryInterface.removeColumn('general_body_meetings', 'minutes_of_meeting_id');
    }
    if (table.notice_id) {
      await queryInterface.removeColumn('general_body_meetings', 'notice_id');
    }
  }
};
