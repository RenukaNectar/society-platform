'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'roles',
      {
        description: 'DRCS/ARCS Audit (HO)',
        updated_at: new Date()
      },
      { name: 'drcs_arcs_auditor' }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'roles',
      {
        description: 'DRCS/ARCS Auditor',
        updated_at: new Date()
      },
      { name: 'drcs_arcs_auditor' }
    );
  }
};
