'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('amendments', 'circular_notice_media_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      }
    });
    await queryInterface.addColumn('amendments', 'minutes_of_meeting_media_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      }
    });
    await queryInterface.addColumn('amendments', 'attendance_sheet_media_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      }
    });
    await queryInterface.addColumn('amendments', 'registration_number_of_previous_application', {
      type: Sequelize.STRING(40),
      allowNull: true
    });
   
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('amendments', 'circular_notice_media_id');
    await queryInterface.removeColumn('amendments', 'minutes_of_meeting_media_id');
    await queryInterface.removeColumn('amendments', 'attendance_sheet_media_id');
    await queryInterface.removeColumn('amendments', 'registration_number_of_previous_application');
  }
};
