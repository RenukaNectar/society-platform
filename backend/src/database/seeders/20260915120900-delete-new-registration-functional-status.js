'use strict';

/**
 * Deletes the "New Registration" row from functional_status.
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260915120900-delete-new-registration-functional-status.js
 *
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260915120900-delete-new-registration-functional-status.js
 */

const STATUS_NAME = 'New Registration';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkDelete('functional_status', {
      name: STATUS_NAME,
    });
  },

  async down(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM functional_status WHERE name = :name LIMIT 1`,
      {
        replacements: { name: STATUS_NAME },
      }
    );

    if (existing && existing.length > 0) {
      return;
    }

    await queryInterface.bulkInsert('functional_status', [
      {
        id: require('uuid').v4(),
        name: STATUS_NAME,
        description: 'Society is new registration',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },
};
