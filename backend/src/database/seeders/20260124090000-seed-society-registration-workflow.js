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
    // 1. Get Module ID for NEW_REGISTRATION (key: SOCIETY_REGISTRATION)
    const module = await queryInterface.rawSelect('modules', {
      where: { key: 'SOCIETY_REGISTRATION' }
    }, ['id']);

    if (!module) {
      console.error('Module SOCIETY_REGISTRATION not found. Please run module seeder first.');
      return;
    }

    // 2. Get Notification Template IDs
    const templates = await queryInterface.sequelize.query(
      `SELECT id, \`key\` FROM notification_templates WHERE \`key\` IN ('society_registration_submit', 'society_registration_forward', 'society_registration_rejected', 'society_registration_resubmitted', 'society_challan_uploaded', 'society_challan_pending', 'society_certificate_issued')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const templateMap = templates.reduce((acc, t) => {
      acc[t.key] = t.id;
      return acc;
    }, {});

    // 3. Ensure all required statuses exist and get their IDs
    const requiredStatuses = [
      { key: 'submitted', title: 'Submitted', description: 'Application has been submitted' },
      { key: 'forwarded', title: 'Forwarded', description: 'Application forwarded to next level' },
      { key: 'approved', title: 'Approved', description: 'Application approved' },
      { key: 'rejected', title: 'Rejected', description: 'Application rejected' },
      { key: 'resubmitted', title: 'Resubmitted', description: 'Application resubmitted' },
      { key: 'challan_uploaded', title: 'Challan Uploaded', description: 'Challan uploaded' },
      { key: 'challan_pending', title: 'Challan Pending', description: 'Challan pending' },
      { key: 'certificate_issued', title: 'Certificate Issued', description: 'Certificate issued' }
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
      `SELECT id, \`key\` FROM statuses WHERE \`key\` IN ('submitted', 'forwarded', 'approved', 'rejected', 'resubmitted', 'challan_uploaded', 'challan_pending', 'certificate_issued')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const statusMap = statuses.reduce((acc, s) => {
      acc[s.key] = s.id;
      return acc;
    }, {});

    // 4. Ensure all required roles exist and get their IDs (using exact names from roles seeder)
    const requiredRoles = [
      { name: 'applicant', description: 'Applicant' },
      { name: 'drcs_arcs_district', description: 'DRCS/ARCS District' },
      { name: 'jics_sics_district', description: 'JICS/SICS District' },
      { name: 'drcs_arcs_hq', description: 'DRCS/ARCS HQ' },
      { name: 'jics_sics_hq', description: 'JICS/SICS HQ' },
      { name: 'jt_rcs_district', description: 'JT RCS District' },
      { name: 'rcs_district', description: 'RCS District' }
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
      `SELECT id, name FROM roles WHERE name IN ('applicant', 'drcs_arcs_district', 'jics_sics_district', 'drcs_arcs_hq', 'jics_sics_hq', 'jt_rcs_district', 'rcs_district')`,
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

    // 5. Define Workflow Levels
    const workflowLevels = [
      // Level 1 – Applicant Submit
      {
        id: uuidv4(),
        module_id: module,
        sequence: 1,
        allowed_role_id: allowedRoleCol(roleMap['applicant']),
        approval_status_id: statusMap['submitted'],
        approval_notification_template_id: templateMap['society_registration_submit'],
        approval_send_to: 'all',
        approval_documents: null,
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
      // Level 2 – DRCS District (forward for examination, document verification, upload other document)
      {
        id: uuidv4(),
        module_id: module,
        sequence: 2,
        allowed_role_id: allowedRoleCol(roleMap['drcs_arcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['society_registration_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['applicant']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['society_registration_rejected'],
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['jics_sics_district']),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 3 – SICS/JICS District (forward and upload inspection report & other document)
      {
        id: uuidv4(),
        module_id: module,
        sequence: 3,
        allowed_role_id: allowedRoleCol(roleMap['jics_sics_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['society_registration_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['inspection_report', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['drcs_arcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['society_registration_rejected'],
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['drcs_arcs_district']),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 4 – DRCS/ARCS District (forward & upload signed non-family certificate & other document)
      {
        id: uuidv4(),
        module_id: module,
        sequence: 4,
        allowed_role_id: allowedRoleCol(roleMap['drcs_arcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['society_registration_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['non_family_coop_certificate', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jics_sics_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['society_registration_rejected'],
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
      // Level 5 – SICS/JICS (H.Q.) – forward & upload other document to DRCS/ARCS HQ
      {
        id: uuidv4(),
        module_id: module,
        sequence: 5,
        allowed_role_id: allowedRoleCol(roleMap['jics_sics_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['society_registration_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['drcs_arcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['society_registration_rejected'],
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
      // Level 6 – DRCS/ARCS (H.Q.) – forward & upload other document to JT RCS (D)
      {
        id: uuidv4(),
        module_id: module,
        sequence: 6,
        allowed_role_id: allowedRoleCol(roleMap['drcs_arcs_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['society_registration_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jics_sics_hq']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['society_registration_rejected'],
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
      // Level 7 – JT RCS (D) – forward & upload other document to RCS (approve/revert)
      {
        id: uuidv4(),
        module_id: module,
        sequence: 7,
        allowed_role_id: allowedRoleCol(roleMap['jt_rcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['society_registration_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['drcs_arcs_hq']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['society_registration_rejected'],
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
      // Level 8 – RCS APPROVE/REVERT: approve → challan_pending (applicant upload challan); revert → back to JT RCS
      {
        id: uuidv4(),
        module_id: module,
        sequence: 8,
        allowed_role_id: allowedRoleCol(roleMap['rcs_district']),
        approval_status_id: statusMap['challan_pending'],
        approval_notification_template_id: templateMap['society_challan_pending'],
        approval_send_to: 'all',
        approval_documents: null,
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['forwarded'],
        reject_notification_template_id: templateMap['society_registration_forward'],
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
      // Level 9 – Applicant upload challan (after RCS approve at Level 8)
      {
        id: uuidv4(),
        module_id: module,
        sequence: 9,
        allowed_role_id: allowedRoleCol(roleMap['applicant']),
        approval_status_id: statusMap['challan_uploaded'],
        approval_notification_template_id: templateMap['society_challan_uploaded'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['challan_receipt']),
        reject_role_id: rejectRoleCol(roleMap['rcs_district']),
        reject_status_id: null,
        reject_notification_template_id: null,
        reject_send_to: null,
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['rcs_district']),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 10 – RCS final stage: IN ORDER → issue certificate & notify all; NOT IN ORDER → revert to JT RCS
      {
        id: uuidv4(),
        module_id: module,
        sequence: 10,
        allowed_role_id: allowedRoleCol(roleMap['rcs_district']),
        approval_status_id: statusMap['certificate_issued'],
        approval_notification_template_id: templateMap['society_certificate_issued'],
        approval_send_to: 'all',
        approval_documents: null,
        reject_role_id: rejectRoleCol(roleMap['applicant']),
        reject_status_id: statusMap['challan_pending'],
        reject_notification_template_id: templateMap['society_challan_pending'],
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
      where: { key: 'SOCIETY_REGISTRATION' }
    }, ['id']);

    if (module) {
      await queryInterface.bulkDelete('module_workflows', { module_id: module }, {});
    }
  }
};
