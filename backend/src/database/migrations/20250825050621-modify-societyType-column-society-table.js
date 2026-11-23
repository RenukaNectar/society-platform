'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    //modify societyType column in society table to ENUM with values 'non-profit', 'for-profit', 'government'
    await queryInterface.changeColumn('society_registrations', 'society_type', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the change
    await queryInterface.changeColumn('society', 'society_type', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  }
};
