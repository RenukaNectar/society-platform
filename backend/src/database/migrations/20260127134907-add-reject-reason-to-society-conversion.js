'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('society_conversion', 'reject_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Reason for rejection of the society conversion'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('society_conversion', 'reject_reason');
  }
};
