'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('misappropriation_levels', [
      { id: require('uuid').v4(), name: 'Management Committee', active: true, created_at: new Date(), updated_at: new Date() },
      { id: require('uuid').v4(), name: 'Employees', active: true, created_at: new Date(), updated_at: new Date() },
      { id: require('uuid').v4(), name: 'Members', active: true, created_at: new Date(), updated_at: new Date() },
      { id: require('uuid').v4(), name: 'Vendors', active: true, created_at: new Date(), updated_at: new Date() }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('misappropriation_levels', null, {});
  }
};
