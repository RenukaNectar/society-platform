'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'statuses',
      { title: 'Approved' },
      { key: 'approved' }
    );

    await queryInterface.bulkUpdate(
      'statuses',
      { title: 'Audit Approved' },
      { key: 'audit_approved' }
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'statuses',
      { title: 'Inspector Approved' }, // previous value
      { key: 'approved' }
    );

    await queryInterface.bulkUpdate(
      'statuses',
      { title: 'audit approved' }, // previous value
      { key: 'audit_approved' }
    );
  }
};
