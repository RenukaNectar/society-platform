'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.rawSelect('statuses', {
      where: { key: 'pending' }
    }, ['id']);

    if (!existing) {
      await queryInterface.bulkInsert('statuses', [{
        id: uuidv4(),
        key: 'pending',
        title: 'Pending',
        description: 'Pending review',
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('statuses', { key: 'pending' });
  }
};
