'use strict';

const { v4: uuidv4 } = require('uuid');

/** Cast role UUID or UUID[] for MySQL JSON columns in bulkInsert (avoids invalid/double-encoded JSON). */
const toJsonRoleCol = (sequelize, value) => {
  if (value == null) return null;
  const json = Array.isArray(value)
    ? JSON.stringify(value.filter((id) => id))
    : JSON.stringify(value);
  return sequelize.literal(`CAST('${json.replace(/'/g, "''")}' AS JSON)`);
};

const getColumnType = async (queryInterface, Sequelize, columnName) => {
  const [row] = await queryInterface.sequelize.query(
    `SELECT COLUMN_TYPE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'module_workflows'
       AND COLUMN_NAME = :columnName
     LIMIT 1`,
    { replacements: { columnName }, type: Sequelize.QueryTypes.SELECT }
  );
  return String(row?.COLUMN_TYPE || '').toLowerCase();
};

const isJsonColumnType = (columnType) => columnType.includes('json');

const buildWorkflowRoleCol = (sequelize, columnType) => (value) => {
  if (value == null) return null;
  if (isJsonColumnType(columnType)) return toJsonRoleCol(sequelize, value);
  if (Array.isArray(value)) return value.filter((id) => id)[0] ?? null;
  return value;
};

/** assigned_to on JSON columns uses plain array JSON (matches renewal seeders). */
const buildAssignedToCol = (columnType) => (value) => {
  if (value == null) return null;
  const ids = (Array.isArray(value) ? value : [value]).filter((id) => id);
  if (ids.length === 0) return null;
  if (isJsonColumnType(columnType)) return JSON.stringify(ids);
  return ids[0];
};

/**
 * 8-step BUSINESS_ACTIVITY approval workflow (aligned with amendment routing):
 * 1 Applicant submit
 * 2 DRCS/ARCS district
 * 3 JICS/SICS district
 * 4 DRCS/ARCS district
 * 5 JICS/SICS HQ
 * 6 DRCS/ARCS HQ
 * 7 JT RCS district
 * 8 RCS district (approve / revert)
 *
 * Run after:
 * - 20261112140000-seed-business-activity-module.js
 * - 20261112140100-seed-business-activity-notification-templates.js
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const moduleId = await queryInterface.rawSelect(
      'modules',
      { where: { key: 'BUSINESS_ACTIVITY' } },
      ['id']
    );

    if (!moduleId) {
      console.error(
        'Module BUSINESS_ACTIVITY not found. Run 20261112140000-seed-business-activity-module.js first.'
      );
      return;
    }

    const templates = await queryInterface.sequelize.query(
      `SELECT id, \`key\` FROM notification_templates WHERE \`key\` IN (
        'business_activity_submit',
        'business_activity_forward',
        'business_activity_approved',
        'business_activity_rejected'
      )`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const templateMap = templates.reduce((acc, t) => {
      acc[t.key] = t.id;
      return acc;
    }, {});

    if (!templateMap.business_activity_submit) {
      console.error(
        'Business activity notification templates missing. Run 20261112140100-seed-business-activity-notification-templates.js first.'
      );
      return;
    }

    const requiredStatuses = [
      { key: 'submitted', title: 'Submitted', description: 'Application has been submitted' },
      { key: 'forwarded', title: 'Forwarded', description: 'Application forwarded to next level' },
      { key: 'approved', title: 'Approved', description: 'Application approved' },
      { key: 'rejected', title: 'Rejected', description: 'Application rejected' },
      { key: 'resubmitted', title: 'Resubmitted', description: 'Application resubmitted' },
    ];

    for (const status of requiredStatuses) {
      const existingStatus = await queryInterface.rawSelect(
        'statuses',
        { where: { key: status.key } },
        ['id']
      );

      if (!existingStatus) {
        await queryInterface.bulkInsert('statuses', [
          {
            id: uuidv4(),
            key: status.key,
            title: status.title,
            description: status.description,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);
      }
    }

    const statuses = await queryInterface.sequelize.query(
      `SELECT id, \`key\` FROM statuses WHERE \`key\` IN ('submitted', 'forwarded', 'approved', 'rejected', 'resubmitted')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const statusMap = statuses.reduce((acc, s) => {
      acc[s.key] = s.id;
      return acc;
    }, {});

    const requiredRoles = [
      { name: 'applicant', description: 'Applicant' },
      { name: 'drcs_arcs_district', description: 'DRCS/ARCS District' },
      { name: 'jics_sics_district', description: 'JICS/SICS District' },
      { name: 'drcs_arcs_hq', description: 'DRCS/ARCS HQ' },
      { name: 'jics_sics_hq', description: 'JICS/SICS HQ' },
      { name: 'jt_rcs_district', description: 'JT RCS District' },
      { name: 'rcs_district', description: 'RCS District' },
    ];

    for (const role of requiredRoles) {
      const existingRole = await queryInterface.rawSelect(
        'roles',
        { where: { name: role.name } },
        ['id']
      );

      if (!existingRole) {
        await queryInterface.bulkInsert('roles', [
          {
            id: uuidv4(),
            name: role.name,
            description: role.description,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);
      }
    }

    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN (
        'applicant',
        'drcs_arcs_district',
        'jics_sics_district',
        'drcs_arcs_hq',
        'jics_sics_hq',
        'jt_rcs_district',
        'rcs_district'
      )`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const roleMap = roles.reduce((acc, r) => {
      acc[r.name] = r.id;
      return acc;
    }, {});

    const allowedRoleType = await getColumnType(queryInterface, Sequelize, 'allowed_role_id');
    const rejectRoleType = await getColumnType(queryInterface, Sequelize, 'reject_role_id');
    const assignedToType = await getColumnType(queryInterface, Sequelize, 'assigned_to');
    const allowedRoleCol = buildWorkflowRoleCol(queryInterface.sequelize, allowedRoleType);
    const rejectRoleCol = buildWorkflowRoleCol(queryInterface.sequelize, rejectRoleType);
    const assignedToCol = buildAssignedToCol(assignedToType);

    await queryInterface.bulkDelete('module_workflows', { module_id: moduleId }, {});

    const workflowLevels = [
      // Level 1 – Applicant submit
      {
        id: uuidv4(),
        module_id: moduleId,
        sequence: 1,
        allowed_role_id: allowedRoleCol(roleMap.applicant),
        approval_status_id: statusMap.submitted,
        approval_notification_template_id: templateMap.business_activity_submit,
        approval_send_to: 'all',
        approval_documents: null,
        reject_role_id: null,
        reject_status_id: null,
        reject_notification_template_id: null,
        reject_send_to: null,
        reject_documents: null,
        assigned_to: assignedToCol(roleMap.drcs_arcs_district),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Level 2 – DRCS/ARCS district
      {
        id: uuidv4(),
        module_id: moduleId,
        sequence: 2,
        allowed_role_id: allowedRoleCol(roleMap.drcs_arcs_district),
        approval_status_id: statusMap.forwarded,
        approval_notification_template_id: templateMap.business_activity_forward,
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap.applicant),
        reject_status_id: statusMap.rejected,
        reject_notification_template_id: templateMap.business_activity_rejected,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap.jics_sics_district),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Level 3 – JICS/SICS district
      {
        id: uuidv4(),
        module_id: moduleId,
        sequence: 3,
        allowed_role_id: allowedRoleCol(roleMap.jics_sics_district),
        approval_status_id: statusMap.forwarded,
        approval_notification_template_id: templateMap.business_activity_forward,
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap.drcs_arcs_district),
        reject_status_id: statusMap.rejected,
        reject_notification_template_id: templateMap.business_activity_rejected,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap.drcs_arcs_district),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Level 4 – DRCS/ARCS district
      {
        id: uuidv4(),
        module_id: moduleId,
        sequence: 4,
        allowed_role_id: allowedRoleCol(roleMap.drcs_arcs_district),
        approval_status_id: statusMap.forwarded,
        approval_notification_template_id: templateMap.business_activity_forward,
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap.jics_sics_district),
        reject_status_id: statusMap.rejected,
        reject_notification_template_id: templateMap.business_activity_rejected,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap.jics_sics_hq),
        is_hq: true,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Level 5 – JICS/SICS HQ
      {
        id: uuidv4(),
        module_id: moduleId,
        sequence: 5,
        allowed_role_id: allowedRoleCol(roleMap.jics_sics_hq),
        approval_status_id: statusMap.forwarded,
        approval_notification_template_id: templateMap.business_activity_forward,
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap.drcs_arcs_district),
        reject_status_id: statusMap.rejected,
        reject_notification_template_id: templateMap.business_activity_rejected,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap.drcs_arcs_hq),
        is_hq: true,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Level 6 – DRCS/ARCS HQ
      {
        id: uuidv4(),
        module_id: moduleId,
        sequence: 6,
        allowed_role_id: allowedRoleCol(roleMap.drcs_arcs_hq),
        approval_status_id: statusMap.forwarded,
        approval_notification_template_id: templateMap.business_activity_forward,
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap.jics_sics_hq),
        reject_status_id: statusMap.rejected,
        reject_notification_template_id: templateMap.business_activity_rejected,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap.jt_rcs_district),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Level 7 – JT RCS district
      {
        id: uuidv4(),
        module_id: moduleId,
        sequence: 7,
        allowed_role_id: allowedRoleCol(roleMap.jt_rcs_district),
        approval_status_id: statusMap.forwarded,
        approval_notification_template_id: templateMap.business_activity_forward,
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['rcs_observations', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap.drcs_arcs_hq),
        reject_status_id: statusMap.rejected,
        reject_notification_template_id: templateMap.business_activity_rejected,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap.rcs_district),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Level 8 – RCS district approve / revert
      {
        id: uuidv4(),
        module_id: moduleId,
        sequence: 8,
        allowed_role_id: allowedRoleCol(roleMap.rcs_district),
        approval_status_id: statusMap.approved,
        approval_notification_template_id: templateMap.business_activity_approved,
        approval_send_to: 'all',
        approval_documents: null,
        reject_role_id: rejectRoleCol(roleMap.jt_rcs_district),
        reject_status_id: statusMap.rejected,
        reject_notification_template_id: templateMap.business_activity_rejected,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: null,
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('module_workflows', workflowLevels, {});
    console.log('BUSINESS_ACTIVITY workflow seeded (8 levels).');
  },

  async down(queryInterface) {
    const moduleId = await queryInterface.rawSelect(
      'modules',
      { where: { key: 'BUSINESS_ACTIVITY' } },
      ['id']
    );

    if (moduleId) {
      await queryInterface.bulkDelete('module_workflows', { module_id: moduleId }, {});
    }
  },
};
