'use strict';

/** Liquidation Office review steps must not ask RCS, Jt. RCS, or DRCS/ARCS HO to upload the liquidation report. The liquidator step keeps that upload. */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [moduleRows] = await queryInterface.sequelize.query(`
      SELECT id FROM modules WHERE \`key\` = 'LIQUIDATION_RCS' LIMIT 1
    `);
    if (!moduleRows?.length) return;

    const moduleId = moduleRows[0].id;

    const updateDocuments = async (sequence, approvalDocuments) => {
      await queryInterface.sequelize.query(`
        UPDATE module_workflows
        SET approval_documents = :approvalDocuments,
            updated_at = NOW()
        WHERE module_id = :moduleId
          AND sequence = :sequence
          AND active = true
      `, {
        replacements: {
          moduleId,
          sequence,
          approvalDocuments,
        },
      });
    };

    await updateDocuments(13, JSON.stringify(['other_documents']));
    await updateDocuments(14, JSON.stringify(['other_documents']));
    await updateDocuments(15, null);
  },

  async down(queryInterface) {
    const [moduleRows] = await queryInterface.sequelize.query(`
      SELECT id FROM modules WHERE \`key\` = 'LIQUIDATION_RCS' LIMIT 1
    `);
    if (!moduleRows?.length) return;

    const moduleId = moduleRows[0].id;

    const updateDocuments = async (sequence, approvalDocuments) => {
      await queryInterface.sequelize.query(`
        UPDATE module_workflows
        SET approval_documents = :approvalDocuments,
            updated_at = NOW()
        WHERE module_id = :moduleId
          AND sequence = :sequence
          AND active = true
      `, {
        replacements: {
          moduleId,
          sequence,
          approvalDocuments,
        },
      });
    };

    await updateDocuments(13, JSON.stringify(['liquidation_report', 'other_documents']));
    await updateDocuments(14, JSON.stringify(['liquidation_report', 'other_documents']));
    await updateDocuments(15, JSON.stringify(['liquidation_report']));
  },
};
