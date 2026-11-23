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

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Get Module ID for Audit Request
    const module = await queryInterface.rawSelect('modules', {
      where: { key: 'AUDIT_REQUEST' }
    }, ['id']);

    if (!module) {
      console.error('Module AUDIT_REQUEST not found. Please run module seeder first.');
      return;
    }

    // 2. Get Notification Template IDs for AUDIT_REQUEST
    const templates = await queryInterface.sequelize.query(
      `SELECT id, \`key\` FROM notification_templates WHERE \`key\` IN ('audit_request_submit', 'audit_request_forward', 'audit_request_approved', 'audit_request_rejected')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const templateMap = templates.reduce((acc, t) => {
      acc[t.key] = t.id;
      return acc;
    }, {});

    // 3. Ensure required statuses exist (reuse from society registration)
    const requiredStatuses = [
      { key: 'submitted', title: 'Submitted', description: 'Application has been submitted' },
      { key: 'forwarded', title: 'Forwarded', description: 'Application forwarded to next level' },
      { key: 'approved', title: 'Approved', description: 'Application approved' },
      { key: 'rejected', title: 'Rejected', description: 'Application rejected' }
    ];

    for (const status of requiredStatuses) {
      const existingStatus = await queryInterface.rawSelect('statuses', {
        where: { key: status.key }
      }, ['id']);

      if (!existingStatus) {
        await queryInterface.bulkInsert('statuses', [{
          id: uuidv4(),
          key: status.key,
          title: status.title,
          description: status.description,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }]);
      }
    }

    const statuses = await queryInterface.sequelize.query(
      `SELECT id, \`key\` FROM statuses WHERE \`key\` IN ('submitted', 'forwarded', 'approved', 'rejected', 'rcs_approved')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const statusMap = statuses.reduce((acc, s) => {
      acc[s.key] = s.id;
      return acc;
    }, {});

    // 4. Ensure all required roles exist for AUDIT_REQUEST workflow
    const requiredRoles = [
      { name: 'applicant', description: 'Applicant' },
      { name: 'dept_jics_sics', description: 'Department JICS/SICS' },
      { name: 'drcs_arcs_district', description: 'DRCS/ARCS District' },
      { name: 'drcs_arcs_hq', description: 'DRCS/ARCS HQ' },
      { name: 'jics_sics_hq', description: 'JICS/SICS HQ' },
      { name: 'drcs_arcs_auditor', description: 'DRCS/ARCS Auditor' },
      { name: 'jt_rcs_district', description: 'JT RCS' },
      { name: 'rcs_district', description: 'RCS' }
    ];

    for (const role of requiredRoles) {
      const existingRole = await queryInterface.rawSelect('roles', {
        where: { name: role.name }
      }, ['id']);

      if (!existingRole) {
        await queryInterface.bulkInsert('roles', [{
          id: uuidv4(),
          name: role.name,
          description: role.description,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }]);
      }
    }

    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('applicant', 'dept_jics_sics', 'drcs_arcs_district', 'drcs_arcs_hq', 'jics_sics_hq', 'drcs_arcs_auditor', 'jt_rcs_district', 'rcs_district')`,
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

    // 5. Define AUDIT_REQUEST Workflow Levels (per flowchart: Applicant → Department JICS/SICS  → DRCS/ARCS (D) → DRCS/ARCS (HQ) → JICS/SICS (HQ) → DRCS/ARCS Auditor → JT_RCS (D) → RCS Approve/Revert)
    const workflowLevels = [
      // Level 1 – Applicant: fill form & submit, upload necessary documents
      {
        id: uuidv4(),
        module_id: module,
        sequence: 1,
        allowed_role_id: allowedRoleCol(roleMap['applicant']),
        approval_status_id: statusMap['submitted'],
        approval_notification_template_id: templateMap['audit_request_submit'] || null,
        approval_send_to: 'all',
        approval_documents: JSON.stringify(['audit_report', 'other_documents']),
        reject_role_id: null,
        reject_status_id: null,
        reject_notification_template_id: null,
        reject_send_to: null,
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['drcs_arcs_district']),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 3 – DRCS/ARCS (District): forward & upload other document to DRCS/ARCS (HQ). Revert to Department JICS/SICS with comment.
      {
        id: uuidv4(),
        module_id: module,
        sequence: 2,
        allowed_role_id: allowedRoleCol(roleMap['drcs_arcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['audit_request_forward'] || null,
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['audit_report', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['dept_jics_sics']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['audit_request_rejected'] || null,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['drcs_arcs_hq']),
        is_hq: true,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 4 – DRCS/ARCS (HQ): forward & upload other document to SICS/JICS (HQ). Revert to DRCS/ARCS (District) with comment.
      {
        id: uuidv4(),
        module_id: module,
        sequence: 3,
        allowed_role_id: allowedRoleCol(roleMap['drcs_arcs_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['audit_request_forward'] || null,
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['audit_report', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['drcs_arcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['audit_request_rejected'] || null,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['jics_sics_hq']),
        is_hq: true,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 5 – SICS/JICS (HQ): forward & upload other document to DRCS/ARCS Audit. Revert to DRCS/ARCS (HQ) with comment.
      {
        id: uuidv4(),
        module_id: module,
        sequence: 4,
        allowed_role_id: allowedRoleCol(roleMap['jics_sics_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['audit_request_forward'] || null,
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['audit_report', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['drcs_arcs_hq']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['audit_request_rejected'] || null,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['drcs_arcs_auditor']),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 6 – DRCS/ARCS (Auditor): forward & upload other document to SICS/JICS (HQ). Revert to DRCS/ARCS (District) with comment.
      {
        id: uuidv4(),
        module_id: module,
        sequence: 5,
        allowed_role_id: allowedRoleCol(roleMap['drcs_arcs_auditor']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['audit_request_forward'] || null,
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['audit_report', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jics_sics_hq']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['audit_request_rejected'] || null,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['jt_rcs_district']),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 7 – JT RCS (District): forward & upload other document to RCS District. Revert to DRCS/ARCS (Auditor) with comment.
      {
        id: uuidv4(),
        module_id: module,
        sequence: 6,
        allowed_role_id: allowedRoleCol(roleMap['jt_rcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['audit_request_forward'] || null,
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['rcs_observations', 'audit_report', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['drcs_arcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['audit_request_rejected'] || null,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['rcs_district']),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 8 – RCS: APPROVE (notify all officers & applicant) or REVERT to JT RCS (D) with comment. Last step saves rcs_approved status.
      {
        id: uuidv4(),
        module_id: module,
        sequence: 7,
        allowed_role_id: allowedRoleCol(roleMap['rcs_district']),
        approval_status_id: statusMap['approved'],
        approval_notification_template_id: templateMap['audit_request_approved'] || null,
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['audit_request_rejected'] || null,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: null,
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
    ];

    await queryInterface.bulkInsert('module_workflows', workflowLevels, {});
  },

  async down(queryInterface, Sequelize) {
    const module = await queryInterface.rawSelect('modules', {
      where: { key: 'AUDIT_REQUEST' }
    }, ['id']);

    if (module) {
      await queryInterface.bulkDelete('module_workflows', { module_id: module }, {});
    }
  }
};
