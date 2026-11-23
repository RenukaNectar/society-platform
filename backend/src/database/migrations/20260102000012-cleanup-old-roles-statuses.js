'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, remove all role permissions for old roles
    await queryInterface.bulkDelete('role_permissions', {
      role_id: [
        '550e8400-e29b-41d4-a716-446655440010', // jics
        '550e8400-e29b-41d4-a716-446655440011', // sics
        '550e8400-e29b-41d4-a716-446655440012', // jacs
        '550e8400-e29b-41d4-a716-446655440013'  // sacs
      ]
    }, {});

    // Remove old roles
    await queryInterface.bulkDelete('roles', {
      name: ['jics', 'sics', 'jacs', 'sacs']
    }, {});

    // Remove old statuses
    await queryInterface.bulkDelete('statuses', {
      key: ['jacs_approved', 'jacs_rejected', 'jics_approved', 'jics_rejected', 'sics_approved', 'sics_rejected', 'sacs_approved', 'sacs_rejected']
    }, {});
  },

  async down(queryInterface, Sequelize) {
    // This migration is not reversible as we're cleaning up old data
    // The original seeders can be re-run if needed
  }
};
