'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkUpdate(
      'arbitration_authorities',
      { name: 'RCS', updated_at: new Date() },
      { name: 'CRCS' }
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkUpdate(
      'arbitration_authorities',
      { name: 'CRCS', updated_at: new Date() },
      { name: 'RCS' }
    );
  }
};
