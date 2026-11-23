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
    // 1. Get Module ID for LIQUIDATION_RCS (RCS-initiated liquidation workflow)
    const module = await queryInterface.rawSelect('modules', {
      where: { key: 'LIQUIDATION_RCS' }
    }, ['id']);

    if (!module) {
      console.error('Module LIQUIDATION_RCS not found. Please run module seeder first.');
      return;
    }

    // 2. Get Notification Template IDs
    const templates = await queryInterface.sequelize.query(
      `SELECT id, \`key\` FROM notification_templates WHERE \`key\` IN ('liquidation_submit', 'liquidation_forward', 'liquidation_rejected', 'liquidation_liquidator_appointed', 'liquidation_liquidator_appointment_rejected', 'liquidation_report_submitted', 'liquidation_auditor_appointed', 'liquidation_auditor_appointment_rejected', 'liquidation_audit_report_submitted', 'liquidation_approved', 'liquidation_final_rejected')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const templateMap = templates.reduce((acc, t) => {
      acc[t.key] = t.id;
      return acc;
    }, {});

    // 3. Get statuses (using existing statuses from previous seeder)
    const statuses = await queryInterface.sequelize.query(
      `SELECT id, \`key\` FROM statuses WHERE \`key\` IN ('submitted', 'forwarded', 'rejected', 'liquidator_appointed', 'liquidator_appointment_rejected', 'liquidation_report_submitted', 'auditor_appointed', 'auditor_appointment_rejected', 'audit_report_submitted', 'approved', 'liquidation_approved')`,
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
      { name: 'jt_rcs_district', description: 'JT RCS District' },
      { name: 'rcs_district', description: 'RCS District' },
      { name: 'jics_sics_liquidator', description: 'JICS/SICS Liquidator' },
      { name: 'jics_sics_auditor', description: 'JICS/SICS Auditor' }
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
      `SELECT id, name FROM roles WHERE name IN ('jics_sics_district', 'drcs_arcs_district', 'jics_sics_hq', 'drcs_arcs_hq', 'jt_rcs_district', 'rcs_district', 'jics_sics_liquidator', 'jics_sics_auditor')`,
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

    // 5. Define Workflow Levels based on RCS Office Flow Diagram
    const workflowLevels = [
      // Level 1 – SICS/JICS (H.Q) Proposes Liquidation
      {
        id: uuidv4(),
        module_id: module,
        sequence: 1,
        allowed_role_id: allowedRoleCol(roleMap['jics_sics_hq']),
        approval_status_id: statusMap['submitted'],
        approval_notification_template_id: templateMap['liquidation_submit'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
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
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jics_sics_hq']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['drcs_arcs_hq']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
      // Level 5 – SICS/JICS (H.Q) - Forward to Liquidator Appointment Phase
      {
        id: uuidv4(),
        module_id: module,
        sequence: 5,
        allowed_role_id: allowedRoleCol(roleMap['jt_rcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
      // Level 5 – SICS/JICS (H.Q) - Forward to Liquidator Appointment Phase
      {
        id: uuidv4(),
        module_id: module,
        sequence: 6,
        allowed_role_id: allowedRoleCol(roleMap['jics_sics_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
        sequence: 7,
        allowed_role_id: allowedRoleCol(roleMap['drcs_arcs_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
      // Level 7 – JT. RCS Requests Liquidator Appointment
      {
        id: uuidv4(),
        module_id: module,
        sequence: 8,
        allowed_role_id: allowedRoleCol(roleMap['jt_rcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['liquidator_appointment_observations']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
      // Level 8 – RCS Approves/Rejects Liquidator Appointment
      {
        id: uuidv4(),
        module_id: module,
        sequence: 9,
        allowed_role_id: allowedRoleCol(roleMap['rcs_district']),
        approval_status_id: statusMap['liquidator_appointed'],
        approval_notification_template_id: templateMap['liquidation_liquidator_appointed'],
        approval_send_to: 'all',
        approval_documents: null,
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['liquidator_appointment_rejected'],
        reject_notification_template_id: templateMap['liquidation_liquidator_appointment_rejected'],
        reject_send_to: 'all',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['jt_rcs_district']),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },

      // jt rcs district forward to jics sics hq
      {
        id: uuidv4(),
        module_id: module,
        sequence: 10,
        allowed_role_id: allowedRoleCol(roleMap['jt_rcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['liquidator_appointment_request']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['jics_sics_liquidator']),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 9 – Liquidator Submits Liquidation Report
      {
        id: uuidv4(),
        module_id: module,
        sequence: 11,
        allowed_role_id: allowedRoleCol(roleMap['jics_sics_liquidator']),
        approval_status_id: statusMap['liquidation_report_submitted'],
        approval_notification_template_id: templateMap['liquidation_report_submitted'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['liquidation_report', 'other_documents']),
        reject_role_id: null,
        reject_status_id: null,
        reject_notification_template_id: null,
        reject_send_to: null,
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['jics_sics_hq']),
        is_hq: true,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 10 – SICS/JICS (H.Q) Reviews Liquidation Report
      {
        id: uuidv4(),
        module_id: module,
        sequence: 12,
        allowed_role_id: allowedRoleCol(roleMap['jics_sics_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: null,
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
      // Level 11 – DRCS/ARCS (H.Q) Reviews Liquidation Report
      {
        id: uuidv4(),
        module_id: module,
        sequence: 13,
        allowed_role_id: allowedRoleCol(roleMap['drcs_arcs_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
      // Level 12 – JT. RCS Requests Auditor Appointment
      {
        id: uuidv4(),
        module_id: module,
        sequence: 14,
        allowed_role_id: allowedRoleCol(roleMap['jt_rcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
      // Level 13 – RCS Approves/Rejects Auditor Appointment
      {
        id: uuidv4(),
        module_id: module,
        sequence: 15,
        allowed_role_id: allowedRoleCol(roleMap['rcs_district']),
        approval_status_id: statusMap['auditor_appointed'],
        approval_notification_template_id: templateMap['liquidation_auditor_appointed'],
        approval_send_to: 'all',
        approval_documents: null,
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['auditor_appointment_rejected'],
        reject_notification_template_id: templateMap['liquidation_auditor_appointment_rejected'],
        reject_send_to: 'all',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['jt_rcs_district']),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },

      // jt rcs district forward to jics sics auditor
      {
        id: uuidv4(),
        module_id: module,
        sequence: 16,
        allowed_role_id: allowedRoleCol(roleMap['jt_rcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['jics_sics_auditor']),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 14 – Auditor Submits Audit Report
      {
        id: uuidv4(),
        module_id: module,
        sequence: 17,
        allowed_role_id: allowedRoleCol(roleMap['jics_sics_auditor']),
        approval_status_id: statusMap['audit_report_submitted'],
        approval_notification_template_id: templateMap['liquidation_audit_report_submitted'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['audit_report']),
        reject_role_id: null,
        reject_status_id: null,
        reject_notification_template_id: null,
        reject_send_to: null,
        reject_documents: null,
        assigned_to: assignedToCol(roleMap['jics_sics_hq']),
        is_hq: true,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 15 – SICS/JICS (H.Q) Reviews Audit Report
      {
        id: uuidv4(),
        module_id: module,
        sequence: 18,
        allowed_role_id: allowedRoleCol(roleMap['jics_sics_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['audit_report', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
      // Level 16 – DRCS/ARCS (H.Q) Reviews Audit Report
      {
        id: uuidv4(),
        module_id: module,
        sequence: 19,
        allowed_role_id: allowedRoleCol(roleMap['drcs_arcs_hq']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['audit_report', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
      // Level 17 – JT. RCS Reviews Audit Report
      {
        id: uuidv4(),
        module_id: module,
        sequence: 20,
        allowed_role_id: allowedRoleCol(roleMap['jt_rcs_district']),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['liquidation_forward'],
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['rcs_observations', 'audit_report', 'other_documents']),
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_rejected'],
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
      // Level 18 – RCS Final Approval/Rejection
      {
        id: uuidv4(),
        module_id: module,
        sequence: 21,
        allowed_role_id: allowedRoleCol(roleMap['rcs_district']),
        approval_status_id: statusMap['liquidation_approved'],
        approval_notification_template_id: templateMap['liquidation_approved'],
        approval_send_to: 'all',
        approval_documents: null,
        reject_role_id: rejectRoleCol(roleMap['jt_rcs_district']),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['liquidation_final_rejected'],
        reject_send_to: 'all',
        reject_documents: null,
        assigned_to: null,
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('module_workflows', workflowLevels, {});
  },

  async down(queryInterface, Sequelize) {
    const module = await queryInterface.rawSelect('modules', {
      where: { key: 'LIQUIDATION_RCS' }
    }, ['id']);

    if (module) {
      await queryInterface.bulkDelete('module_workflows', {
        module_id: module
      }, {});
    }
  }
};
