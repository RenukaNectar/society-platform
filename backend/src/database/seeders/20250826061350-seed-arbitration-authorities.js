'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('arbitration_authorities', [
      { id: require('uuid').v4(), name: 'Courts', active: true, created_at: new Date(), updated_at: new Date() },
      { id: require('uuid').v4(), name: 'CRCS', active: true, created_at: new Date(), updated_at: new Date() },
      { id: require('uuid').v4(), name: 'Appellate Authority', active: true, created_at: new Date(), updated_at: new Date() }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('arbitration_authorities', null, {});
  }
};
