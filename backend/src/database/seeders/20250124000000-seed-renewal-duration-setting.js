'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('settings', [
      {
        id: require('uuid').v4(),
        key: 'renewal_duration',
        title: 'Renewal Duration',
        description: 'Duration in months for renewal period',
        value: '6',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {
      ignoreDuplicates: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('settings', {
      key: 'renewal_duration'
    }, {});
  }
};
