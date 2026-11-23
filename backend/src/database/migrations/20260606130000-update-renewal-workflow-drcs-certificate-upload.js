'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [moduleRows] = await queryInterface.sequelize.query(`
      SELECT id FROM modules WHERE \`key\` = 'SOCIETY_RENEWAL' LIMIT 1
    `);
    if (!moduleRows?.length) return;

    const moduleId = moduleRows[0].id;

    const [jicsRows] = await queryInterface.sequelize.query(`
      SELECT mw.id
      FROM module_workflows mw
      INNER JOIN roles r ON r.id = mw.allowed_role_id
      WHERE mw.module_id = :moduleId
        AND mw.sequence = 3
        AND r.name = 'jics_sics_district'
        AND mw.active = true
      LIMIT 1
    `, { replacements: { moduleId } });

    if (jicsRows?.length) {
      await queryInterface.sequelize.query(`
        UPDATE module_workflows
        SET approval_documents = NULL,
            reject_documents = NULL,
            updated_at = NOW()
        WHERE id = :id
      `, { replacements: { id: jicsRows[0].id } });
    }

    const [drcsRows] = await queryInterface.sequelize.query(`
      SELECT mw.id
      FROM module_workflows mw
      INNER JOIN roles r ON r.id = mw.allowed_role_id
      WHERE mw.module_id = :moduleId
        AND mw.sequence = 4
        AND r.name = 'drcs_arcs_district'
        AND mw.active = true
      LIMIT 1
    `, { replacements: { moduleId } });

    if (!drcsRows?.length) return;

    await queryInterface.sequelize.query(`
      UPDATE module_workflows
      SET approval_documents = :approvalDocuments,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: {
        id: drcsRows[0].id,
        approvalDocuments: JSON.stringify(['renewal_certificate']),
      },
    });
  },

  async down(queryInterface) {
    const [moduleRows] = await queryInterface.sequelize.query(`
      SELECT id FROM modules WHERE \`key\` = 'SOCIETY_RENEWAL' LIMIT 1
    `);
    if (!moduleRows?.length) return;

    const moduleId = moduleRows[0].id;

    const [drcsRows] = await queryInterface.sequelize.query(`
      SELECT mw.id
      FROM module_workflows mw
      INNER JOIN roles r ON r.id = mw.allowed_role_id
      WHERE mw.module_id = :moduleId
        AND mw.sequence = 4
        AND r.name = 'drcs_arcs_district'
        AND mw.active = true
      LIMIT 1
    `, { replacements: { moduleId } });

    if (drcsRows?.length) {
      await queryInterface.sequelize.query(`
        UPDATE module_workflows
        SET approval_documents = NULL,
            updated_at = NOW()
        WHERE id = :id
      `, { replacements: { id: drcsRows[0].id } });
    }

    const [jicsRows] = await queryInterface.sequelize.query(`
      SELECT mw.id
      FROM module_workflows mw
      INNER JOIN roles r ON r.id = mw.allowed_role_id
      WHERE mw.module_id = :moduleId
        AND mw.sequence = 3
        AND r.name = 'jics_sics_district'
        AND mw.active = true
      LIMIT 1
    `, { replacements: { moduleId } });

    if (!jicsRows?.length) return;

    await queryInterface.sequelize.query(`
      UPDATE module_workflows
      SET approval_documents = :approvalDocuments,
          reject_documents = :rejectDocuments,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: {
        id: jicsRows[0].id,
        approvalDocuments: JSON.stringify(['renewal_certificate']),
        rejectDocuments: JSON.stringify(['renewal_certificate']),
      },
    });
  },
};
