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
    // 1. Get Module ID for INSPECTION_INQUIRY_RCS (RCS-initiated inspection/inquiry workflow)
    const module = await queryInterface.rawSelect('modules', {
      where: { key: 'INSPECTION_INQUIRY_RCS' }
    }, ['id']);

    if (!module) {
      console.error('Module INSPECTION_INQUIRY_RCS not found. Please run module seeder first.');
      return;
    }

    // 2. Get Notification Template IDs
    const templates = await queryInterface.sequelize.query(
      `SELECT id, \`key\` FROM notification_templates WHERE \`key\` IN ('inspection_submit', 'inspection_forward', 'inspection_rejected', 'inspection_approved', 'inspection_inquiry_submit', 'inspection_inquiry_forward', 'inspection_inquiry_rejected', 'inspection_inquiry_approved')`,
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
      { key: 'rejected', title: 'Rejected', description: 'Application rejected' },
      { key: 'approved', title: 'Approved', description: 'Application approved' },
      { key: 'inspection_approved', title: 'Inspection Approved', description: 'Inspection has been approved' },
      { key: 'inspection_inquiry_approved', title: 'Inspection Inquiry Approved', description: 'Inspection inquiry has been approved' }
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
      `SELECT id, \`key\` FROM statuses WHERE \`key\` IN ('submitted', 'forwarded', 'rejected', 'approved', 'inspection_approved', 'inspection_inquiry_approved')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const statusMap = statuses.reduce((acc, s) => {
      acc[s.key] = s.id;
      return acc;
    }, {});

    // 4. Ensure all required roles exist and get their IDs
    const requiredRoles = [
      { name: 'jics_sics_hq', description: 'JICS/SICS HQ' },
      { name: 'drcs_arcs_hq', description: 'DRCS/ARCS HQ' },
      { name: 'inspecting_officer_hq', description: 'Inspecting Officer (HO)' },
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
      `SELECT id, name FROM roles WHERE name IN ('jics_sics_hq', 'drcs_arcs_hq', 'jt_rcs_district', 'rcs_district', 'inspecting_officer_hq')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const roleMap = roles.reduce((acc, r) => {
      acc[r.name] = r.id;
      return acc;
    }, {});

    // const hqRolePool = [
    //   roleMap['jics_sics_hq'],
    //   roleMap['drcs_arcs_hq'],
    //   roleMap['jt_rcs_district']
    // ];

    const allowedRoleType = await getColumnType(queryInterface, Sequelize, 'allowed_role_id');
    const rejectRoleType = await getColumnType(queryInterface, Sequelize, 'reject_role_id');
    const assignedToType = await getColumnType(queryInterface, Sequelize, 'assigned_to');
    const allowedRoleCol = buildWorkflowRoleCol(queryInterface.sequelize, allowedRoleType);
    const rejectRoleCol = buildWorkflowRoleCol(queryInterface.sequelize, rejectRoleType);
    const assignedToCol = buildAssignedToCol(assignedToType);

    // 5. Define Workflow Levels based on RCS Office Flow Diagram
    const workflowLevels = [
      // Level 1 – SICS/JICS (H.Q) Proposes Liquidation
      {
        id: uuidv4(),
        module_id: module,
        sequence: 1,
        allowed_role_id: allowedRoleCol(roleMap['jics_sics_hq']),
        approval_status_id: statusMap['submitted'],
        approval_notification_template_id: templateMap['inspection_inquiry_submit'],
        approval_send_to: 'all',
        approval_documents: null,
        reject_role_id: null,
        reject_status_id: null,
        reject_notification_template_id: null,
        reject_send_to: null,
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['drcs_arcs_hq']),
        is_hq: true,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 2 – DRCS/ARCS (H.Q) Review
      {
        id: uuidv4(),
        module_id: module,
        sequence: 2,
        allowed_role_id: allowedRoleCol(roleMap['drcs_arcs_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['inspection_inquiry_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['office_order', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jics_sics_hq']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['inspection_inquiry_rejected'],
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
      // Level 3 – JT. RCS (D) Review
      {
        id: uuidv4(),
        module_id: module,
        sequence: 3,
        allowed_role_id: allowedRoleCol(roleMap['jt_rcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['inspection_inquiry_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['office_order']),
        reject_role_id: rejectRoleCol(roleMap['drcs_arcs_hq']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['inspection_inquiry_rejected'],
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
      // Level 4 – RCS Initial Review and Forward
      {
        id: uuidv4(),
        module_id: module,
        sequence: 4,
        allowed_role_id: allowedRoleCol(roleMap['rcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['inspection_inquiry_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['inspection_inquiry_rejected'],
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
      // Level 5 – JT. RCS (D) Review
      {
        id: uuidv4(),
        module_id: module,
        sequence: 5,
        allowed_role_id: allowedRoleCol(roleMap['jt_rcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['inspection_inquiry_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['office_order', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['inspection_inquiry_rejected'],
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
      // Level 6 – DRCS/ARCS (H.Q) - Forward to Liquidator Appointment Request
      {
        id: uuidv4(),
        module_id: module,
        sequence: 6,
        allowed_role_id: allowedRoleCol(roleMap['drcs_arcs_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['inspection_inquiry_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['inspection_inquiry_rejected'],
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['inspecting_officer_hq']),
        is_hq: true,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 7 – Inspecting Officer (HQ pool): upload inquiry/inspection report
      {
        id: uuidv4(),
        module_id: module,
        sequence: 7,
        allowed_role_id: allowedRoleCol(roleMap['inspecting_officer_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['inspection_inquiry_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['inspection_report', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['drcs_arcs_hq']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['inspection_inquiry_rejected'],
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
      // Level 8 – SICS/JICS (H.Q): review report and forward
      {
        id: uuidv4(),
        module_id: module,
        sequence: 8,
        allowed_role_id: allowedRoleCol(roleMap['jics_sics_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['inspection_inquiry_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['inspecting_officer_hq']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['inspection_inquiry_rejected'],
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
      // Level 9 – DRCS/ARCS (H.Q): review report and forward
      {
        id: uuidv4(),
        module_id: module,
        sequence: 9,
        allowed_role_id: allowedRoleCol(roleMap['drcs_arcs_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['inspection_inquiry_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jics_sics_hq']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['inspection_inquiry_rejected'],
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
      // Level 10 – JT. RCS (D) Review
      {
        id: uuidv4(),
        module_id: module,
        sequence: 10,
        allowed_role_id: allowedRoleCol(roleMap['jt_rcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['inspection_inquiry_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['rcs_observations', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['drcs_arcs_hq']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['inspection_inquiry_rejected'],
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
      // Level 11 – RCS Final Review (APPROVE / NOT APPROVE)
      {
        id: uuidv4(),
        module_id: module,
        sequence: 11,
        allowed_role_id: allowedRoleCol(roleMap['rcs_district']),
        approval_status_id: statusMap['inspection_inquiry_approved'],
        approval_notification_template_id: templateMap['inspection_inquiry_approved'],
        approval_send_to: 'all',
        approval_documents: null,
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['inspection_inquiry_rejected'],
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
      where: { key: 'INSPECTION_INQUIRY_RCS' }
    }, ['id']);

    if (module) {
      await queryInterface.bulkDelete('module_workflows', {
        module_id: module
      }, {});
    }
  }
};
