'use strict';

const { DataTypes } = require('sequelize');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('society_registrations', 'certificate_media_id', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('society_registrations', 'certificate_issue_date', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.NOW
    });
    await queryInterface.addColumn('society_registrations', 'certificate_issued', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('society_registrations', 'certificate_media_id');
    await queryInterface.removeColumn('society_registrations', 'certificate_issue_date');
    await queryInterface.removeColumn('society_registrations', 'certificate_issued');
  }
};
