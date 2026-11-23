'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('society_registrations', 'certificate_issued');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('society_registrations', 'certificate_issued', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });
  }
};
