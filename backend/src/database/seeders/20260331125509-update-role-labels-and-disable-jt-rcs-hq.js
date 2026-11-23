'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Label-only updates (do NOT change role "name" keys)
    await queryInterface.bulkUpdate(
      'roles',
      { description: 'RCS', updated_at: now },
      { name: 'rcs_district' }
    );

    await queryInterface.bulkUpdate(
      'roles',
      { description: 'JT RCS', updated_at: now },
      { name: 'jt_rcs_district' }
    );

    // "Remove" JT RCS HQ by disabling the role (keeps DB references safe)
    await queryInterface.bulkUpdate(
      'roles',
      { is_active: false, updated_at: now },
      { name: 'jt_rcs_hq' }
    );
  },

  async down(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkUpdate(
      'roles',
      { description: 'RCS District', updated_at: now },
      { name: 'rcs_district' }
    );

    await queryInterface.bulkUpdate(
      'roles',
      { description: 'JT RCS District', updated_at: now },
      { name: 'jt_rcs_district' }
    );

    await queryInterface.bulkUpdate(
      'roles',
      { is_active: true, updated_at: now },
      { name: 'jt_rcs_hq' }
    );
  }
};

