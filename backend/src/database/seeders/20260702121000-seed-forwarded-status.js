'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const status = {
      key: 'forwarded',
      title: 'Forwarded',
      description: 'Application forwarded to next level',
    };

    const existing = await queryInterface.sequelize.query(
      'SELECT `key` FROM statuses WHERE `key` = :key LIMIT 1',
      { replacements: { key: status.key }, type: Sequelize.QueryTypes.SELECT }
    );

    if (!existing || existing.length === 0) {
      const now = new Date();
      await queryInterface.bulkInsert(
        'statuses',
        [
          {
            id: uuidv4(),
            key: status.key,
            title: status.title,
            description: status.description,
            is_active: true,
            created_at: now,
            updated_at: now,
          },
        ],
        {}
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('statuses', { key: 'forwarded' }, {});
  },
};

