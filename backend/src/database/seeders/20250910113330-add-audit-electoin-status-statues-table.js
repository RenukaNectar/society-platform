'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // audit approved status
    await queryInterface.bulkInsert('statuses', [{
      id: require('uuid').v4(),
      title: 'audit approved', // audit approved
      description: 'Audit approved',
      key: 'audit_approved',
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    // election approved status
    await queryInterface.bulkInsert('statuses', [{
      id: require('uuid').v4(),
      title: 'election approved', // election approved
      description: 'Election approved',
      key: 'election_approved',
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('statuses', {
      key: ['audit_approved', 'election_approved']
    }, {});
  }
};
