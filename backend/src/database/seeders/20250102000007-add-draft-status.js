'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const draftStatus = {
      id: require('uuid').v4(),
      key: 'draft',
      title: 'Draft',
      description: 'Application is saved as draft and not yet submitted',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const existing = await queryInterface.sequelize.query(
      `SELECT \`key\` FROM statuses WHERE \`key\` = :key LIMIT 1`,
      { replacements: { key: draftStatus.key }, type: Sequelize.QueryTypes.SELECT }
    );
    if (!existing || existing.length === 0) {
      await queryInterface.bulkInsert('statuses', [draftStatus], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('statuses', {
      key: 'draft'
    }, {});
  }
};
