'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('society_conversion', 'created_by', {
      type: Sequelize.UUID,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('society_conversion', 'created_by', {
      type: Sequelize.BIGINT,
      allowNull: true
    });
  }
};
