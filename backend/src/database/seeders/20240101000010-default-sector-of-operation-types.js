'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('sector_of_operations', [
      {
        id: require('uuid').v4(),
        name: 'Credit',
        description: 'Credit cooperative societies',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Non-credit',
        description: 'Non-credit cooperative societies',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('sector_of_operations', null, {});
  }
}; 