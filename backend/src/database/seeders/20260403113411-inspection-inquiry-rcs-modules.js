'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const existing = await queryInterface.rawSelect('modules', {
      where: { key: 'INSPECTION_INQUIRY_RCS' }
    }, ['id']);

    if (existing) {
      console.log('Module INSPECTION_INQUIRY_RCS already exists, skipping insert.');
      return;
    }

    await queryInterface.bulkInsert('modules', [
      {
        id: uuidv4(),
        name: 'Inspection & Inquiry RCS',
        description: 'Inspection & Inquiry RCS',
        key: 'INSPECTION_INQUIRY_RCS',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('modules', {
      key: 'INSPECTION_INQUIRY_RCS'
    });
  }
};
