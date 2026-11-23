'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('cost_of_management_types', [
      { id: require('uuid').v4(), name: 'Salary', active: true, created_at: new Date(), updated_at: new Date() },
      { id: require('uuid').v4(), name: 'Other Expenses', active: true, created_at: new Date(), updated_at: new Date() },
      { id: require('uuid').v4(), name: 'Other Administrative Cost', active: true, created_at: new Date(), updated_at: new Date() }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('cost_of_management_types', null, {});
  }
};
