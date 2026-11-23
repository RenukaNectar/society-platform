'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.rawSelect(
      'modules',
      { where: { key: 'BUSINESS_ACTIVITY' } },
      ['id']
    );

    if (existing) {
      console.log('Module BUSINESS_ACTIVITY already exists, skipping insert.');
      return;
    }

    await queryInterface.bulkInsert('modules', [
      {
        id: uuidv4(),
        name: 'Business Activity (Sector of Operation)',
        description: 'Approval workflow for cooperative society business activity / sector forms',
        key: 'BUSINESS_ACTIVITY',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('modules', { key: 'BUSINESS_ACTIVITY' }, {});
  },
};
