'use strict';

/** JICS/SICS uploads renewal_certificate at step 3; DRCS final step 4 issues (QR stamp) without re-upload. */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [moduleRows] = await queryInterface.sequelize.query(`
      SELECT id FROM modules WHERE \`key\` = 'SOCIETY_RENEWAL' LIMIT 1
    `);
    if (!moduleRows?.length) return;

    const moduleId = moduleRows[0].id;

    const [jicsRows] = await queryInterface.sequelize.query(`
      SELECT id FROM module_workflows
      WHERE module_id = :moduleId
        AND sequence = 3
        AND active = true
      LIMIT 1
    `, { replacements: { moduleId } });

    if (jicsRows?.length) {
      await queryInterface.sequelize.query(`
        UPDATE module_workflows
        SET approval_documents = :approvalDocuments,
            reject_documents = NULL,
            updated_at = NOW()
        WHERE id = :id
      `, {
        replacements: {
          id: jicsRows[0].id,
          approvalDocuments: JSON.stringify(['renewal_certificate']),
        },
      });
    }

    const [drcsRows] = await queryInterface.sequelize.query(`
      SELECT id FROM module_workflows
      WHERE module_id = :moduleId
        AND sequence = 4
        AND active = true
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
  },

  async down(queryInterface) {
    const [moduleRows] = await queryInterface.sequelize.query(`
      SELECT id FROM modules WHERE \`key\` = 'SOCIETY_RENEWAL' LIMIT 1
    `);
    if (!moduleRows?.length) return;

    const moduleId = moduleRows[0].id;

    const [jicsRows] = await queryInterface.sequelize.query(`
      SELECT id FROM module_workflows
      WHERE module_id = :moduleId
        AND sequence = 3
        AND active = true
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
      SELECT id FROM module_workflows
      WHERE module_id = :moduleId
        AND sequence = 4
        AND active = true
      LIMIT 1
    `, { replacements: { moduleId } });

    if (drcsRows?.length) {
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
    }
  },
};
