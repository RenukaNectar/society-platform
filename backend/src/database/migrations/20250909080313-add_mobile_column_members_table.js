'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.addColumn('members', 'mobile', {
    type: Sequelize.STRING(20),
    allowNull: true
   });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('members', 'mobile');
  }
};
