'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const statuses = [
      {
        id: require('uuid').v4(),
        key: 'jics_jacs_approved',
        title: 'JICS/JACS APPROVED',
        description: 'APPLICATION HAS BEEN APPROVED BY JICS/JACS',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'jics_jacs_rejected',
        title: 'JICS/JACS REJECTED',
        description: 'APPLICATION HAS BEEN REJECTED BY JICS/JACS',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'sics_sacs_approved',
        title: 'SICS/SACS APPROVED',
        description: 'APPLICATION HAS BEEN APPROVED BY SICS/SACS',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'sics_sacs_rejected',
        title: 'SICS/SACS REJECTED',
        description: 'APPLICATION HAS BEEN REJECTED BY SICS/SACS',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const existing = await queryInterface.sequelize.query(
      `SELECT \`key\` FROM statuses WHERE \`key\` IN (:keys)`,
      { replacements: { keys: statuses.map(s => s.key) }, type: Sequelize.QueryTypes.SELECT }
    );
    const existingKeys = new Set((existing || []).map(r => r.key));
    const toInsert = statuses.filter(s => !existingKeys.has(s.key));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('statuses', toInsert, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('statuses', {
      key: ['jics_jacs_approved', 'jics_jacs_rejected', 'sics_sacs_approved', 'sics_sacs_rejected']
    }, {});
  }
};
