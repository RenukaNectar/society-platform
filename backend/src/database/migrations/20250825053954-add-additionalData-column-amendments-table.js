'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // add additionalData column of type JSON to amendments table
    await queryInterface.addColumn('amendments', 'additional_data', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Additional JSON data for amendments'
    });
  },

  async down(queryInterface, Sequelize) {
    // remove additionalData column from amendments table
    await queryInterface.removeColumn('amendments', 'additional_data');
  }
};
