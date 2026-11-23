'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('society_conversion', 'data', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Additional JSON data for society conversion'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('society_conversion', 'data');
  }
};
