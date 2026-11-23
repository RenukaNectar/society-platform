'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(`
      SELECT mw.id
      FROM module_workflows mw
      INNER JOIN modules m ON m.id = mw.module_id
      INNER JOIN roles r ON r.id = mw.allowed_role_id
      WHERE m.key = 'AGM'
        AND mw.sequence = 7
        AND r.name = 'jt_rcs_district'
        AND mw.active = true
      LIMIT 1
    `);

    if (!rows?.length) return;

    await queryInterface.sequelize.query(`
      UPDATE module_workflows
      SET approval_documents = :approvalDocuments,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: {
        id: rows[0].id,
        approvalDocuments: JSON.stringify(['other_documents']),
      },
    });
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(`
      SELECT mw.id
      FROM module_workflows mw
      INNER JOIN modules m ON m.id = mw.module_id
      INNER JOIN roles r ON r.id = mw.allowed_role_id
      WHERE m.key = 'AGM'
        AND mw.sequence = 7
        AND r.name = 'jt_rcs_district'
        AND mw.active = true
      LIMIT 1
    `);

    if (!rows?.length) return;

    await queryInterface.sequelize.query(`
      UPDATE module_workflows
      SET approval_documents = NULL,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id: rows[0].id },
    });
  },
};
