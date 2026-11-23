'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('urban_local_bodies', 'state_name', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('urban_local_bodies', 'state_name', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};
