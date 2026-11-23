'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('statuses', [
      {
        id: require('uuid').v4(),
        title: 'Audit Rejected',
        description: 'Audit Rejected',
        key: 'audit_rejected',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },{
        id: require('uuid').v4(),
        title: 'Election Rejected',
        description: 'Election Rejected',
        key: 'election_rejected',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('statuses', {
      key: ['audit_rejected', 'election_rejected']
    });
  }
};
