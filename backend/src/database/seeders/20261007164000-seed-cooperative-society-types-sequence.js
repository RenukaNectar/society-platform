'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const updates = [
      { name: 'Primary Cooperative', sequence: 1 },
      { name: 'District Cooperative', sequence: 2 },
      { name: 'State Cooperative', sequence: 3 }
    ];

    for (const { name, sequence } of updates) {
      await queryInterface.bulkUpdate(
        'cooperative_society_types',
        { sequence, updated_at: now },
        { name }
      );
    }
  },

  async down(queryInterface) {
    const names = [
      'Primary Cooperative',
      'District Cooperative',
      'State Cooperative'
    ];

    for (const name of names) {
      await queryInterface.bulkUpdate(
        'cooperative_society_types',
        { sequence: null, updated_at: new Date() },
        { name }
      );
    }
  }
};
