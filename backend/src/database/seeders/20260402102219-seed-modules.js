'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('modules', [
      {
        id: uuidv4(),
        name: 'Board of Directors',
        description: 'Board of Directors',
        key: 'BOD',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('modules', {
    key: 'BOD'
  }, {});
  }
};
