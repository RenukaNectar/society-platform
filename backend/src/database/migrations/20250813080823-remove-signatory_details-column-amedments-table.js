'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('amendments', 'signatory_details');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('amendments', 'signatory_details', {
      type: Sequelize.JSON,
      allowNull: true
    });
  }
};
