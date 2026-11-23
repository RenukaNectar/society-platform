'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE module_workflows mw
      INNER JOIN modules m ON m.id = mw.module_id
      SET mw.is_hq = false,
          mw.updated_at = NOW()
      WHERE m.key = 'SOCIETY_REGISTRATION'
        AND mw.sequence = 6
        AND mw.active = true
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE module_workflows mw
      INNER JOIN modules m ON m.id = mw.module_id
      SET mw.is_hq = true,
          mw.updated_at = NOW()
      WHERE m.key = 'SOCIETY_REGISTRATION'
        AND mw.sequence = 6
        AND mw.active = true
    `);
  },
};
