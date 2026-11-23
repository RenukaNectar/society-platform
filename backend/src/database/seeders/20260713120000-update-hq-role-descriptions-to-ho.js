'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkUpdate(
      'roles',
      { description: 'DRCS/ARCS HO', updated_at: now },
      { name: 'drcs_arcs_hq' }
    );

    await queryInterface.bulkUpdate(
      'roles',
      { description: 'JICS/SICS HO', updated_at: now },
      { name: 'jics_sics_hq' }
    );
  },

  async down(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkUpdate(
      'roles',
      { description: 'DRCS/ARCS HQ', updated_at: now },
      { name: 'drcs_arcs_hq' }
    );

    await queryInterface.bulkUpdate(
      'roles',
      { description: 'JICS/SICS HQ', updated_at: now },
      { name: 'jics_sics_hq' }
    );
  }
};
