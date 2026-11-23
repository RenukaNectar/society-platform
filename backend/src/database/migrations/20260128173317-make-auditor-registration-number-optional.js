'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('audit_requests', 'auditor_registration_number', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('audit_requests', 'auditor_registration_number', {
      type: Sequelize.STRING(100),
      allowNull: false
    });
  }
};
