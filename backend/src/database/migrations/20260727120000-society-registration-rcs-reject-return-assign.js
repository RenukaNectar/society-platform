'use strict';

/**
 * SOCIETY_REGISTRATION RCS reject/return:
 * - Level 8 revert → forwarded (return to JT RCS), not final rejected
 * - Level 10 reject after challan → challan_pending / applicant (code assigns created_by)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [moduleRow] = await queryInterface.sequelize.query(
      `SELECT id FROM modules WHERE \`key\` = 'SOCIETY_REGISTRATION' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!moduleRow?.id) {
      console.warn('SOCIETY_REGISTRATION module not found; skip RCS reject/return patch');
      return;
    }

    const statuses = await queryInterface.sequelize.query(
      `SELECT id, \`key\` FROM statuses WHERE \`key\` IN ('forwarded', 'challan_pending')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const statusMap = statuses.reduce((acc, row) => {
      acc[row.key] = row.id;
      return acc;
    }, {});

    const templates = await queryInterface.sequelize.query(
      `SELECT id, \`key\` FROM notification_templates WHERE \`key\` IN ('society_registration_forward', 'society_challan_pending')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const templateMap = templates.reduce((acc, row) => {
      acc[row.key] = row.id;
      return acc;
    }, {});

    const [applicantRole] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'applicant' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (statusMap.forwarded) {
      await queryInterface.sequelize.query(
        `UPDATE module_workflows
         SET reject_status_id = :rejectStatusId,
             reject_notification_template_id = :rejectTemplateId,
             updated_at = NOW()
         WHERE module_id = :moduleId
           AND sequence = 8
           AND active = 1`,
        {
          replacements: {
            moduleId: moduleRow.id,
            rejectStatusId: statusMap.forwarded,
            rejectTemplateId: templateMap.society_registration_forward || null
          }
        }
      );
    }

    if (statusMap.challan_pending && applicantRole?.id) {
      const rejectRoleJson = JSON.stringify(applicantRole.id).replace(/'/g, "''");
      await queryInterface.sequelize.query(
        `UPDATE module_workflows
         SET reject_status_id = :rejectStatusId,
             reject_role_id = CAST('${rejectRoleJson}' AS JSON),
             reject_notification_template_id = :rejectTemplateId,
             reject_send_to = 'single',
             assigned_to = NULL,
             updated_at = NOW()
         WHERE module_id = :moduleId
           AND sequence = 10
           AND active = 1`,
        {
          replacements: {
            moduleId: moduleRow.id,
            rejectStatusId: statusMap.challan_pending,
            rejectTemplateId: templateMap.society_challan_pending || null
          }
        }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    const [moduleRow] = await queryInterface.sequelize.query(
      `SELECT id FROM modules WHERE \`key\` = 'SOCIETY_REGISTRATION' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!moduleRow?.id) return;

    const statuses = await queryInterface.sequelize.query(
      `SELECT id, \`key\` FROM statuses WHERE \`key\` IN ('rejected', 'challan_pending')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const statusMap = statuses.reduce((acc, row) => {
      acc[row.key] = row.id;
      return acc;
    }, {});

    const [jtRcsRole] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'jt_rcs_district' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const [rejectedTemplate] = await queryInterface.sequelize.query(
      `SELECT id FROM notification_templates WHERE \`key\` = 'society_registration_rejected' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (statusMap.rejected) {
      await queryInterface.sequelize.query(
        `UPDATE module_workflows
         SET reject_status_id = :rejectStatusId,
             reject_notification_template_id = :rejectTemplateId,
             updated_at = NOW()
         WHERE module_id = :moduleId AND sequence = 8 AND active = 1`,
        {
          replacements: {
            moduleId: moduleRow.id,
            rejectStatusId: statusMap.rejected,
            rejectTemplateId: rejectedTemplate?.id || null
          }
        }
      );
    }

    if (statusMap.rejected && jtRcsRole?.id) {
      const jtRcsRoleJson = JSON.stringify(jtRcsRole.id).replace(/'/g, "''");
      await queryInterface.sequelize.query(
        `UPDATE module_workflows
         SET reject_status_id = :rejectStatusId,
             reject_role_id = CAST('${jtRcsRoleJson}' AS JSON),
             reject_notification_template_id = :rejectTemplateId,
             updated_at = NOW()
         WHERE module_id = :moduleId AND sequence = 10 AND active = 1`,
        {
          replacements: {
            moduleId: moduleRow.id,
            rejectStatusId: statusMap.rejected,
            rejectTemplateId: rejectedTemplate?.id || null
          }
        }
      );
    }
  }
};
