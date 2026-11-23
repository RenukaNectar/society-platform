'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Get Module ID for SOCIETY_RENEWAL
    const module = await queryInterface.rawSelect('modules', {
      where: { key: 'SOCIETY_RENEWAL' }
    }, ['id']);

    if (!module) {
      console.error('Module SOCIETY_RENEWAL not found. Please run module seeder first.');
      return;
    }

    // 2. Get Notification Template IDs
    const templates = await queryInterface.sequelize.query(
      `SELECT id, \`key\` FROM notification_templates WHERE \`key\` IN ('society_renewal_challan_uploaded', 'society_renewal_forwarded', 'society_renewal_certificate_issued', 'society_renewal_resubmitted')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const templateMap = templates.reduce((acc, t) => {
      acc[t.key] = t.id;
      return acc;
    }, {});

    // 3. Ensure all required statuses exist and get their IDs
    const requiredStatuses = [
      { key: 'renewal_challan_uploaded', title: 'Renewal Challan Uploaded', description: 'Renewal challan has been uploaded by applicant' },
      { key: 'forwarded', title: 'Forwarded', description: 'Application forwarded to next level' },
      { key: 'reverted', title: 'Reverted', description: 'Application reverted to previous level' },
      { key: 'renewal_certificate_issued', title: 'Renewal Certificate Issued', description: 'Renewal certificate has been issued by RCS' },
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
      `SELECT id, \`key\` FROM statuses WHERE \`key\` IN ('renewal_challan_uploaded', 'forwarded', 'reverted', 'renewal_certificate_issued', 'rejected')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const statusMap = statuses.reduce((acc, s) => {
      acc[s.key] = s.id;
      return acc;
    }, {});

    // 4. Ensure all required roles exist and get their IDs (match names used in workflow steps)
    const requiredRoles = [
      { name: 'applicant', description: 'Applicant' },
      { name: 'drcs_arcs_district', description: 'DRCS/ARCS District' },
      { name: 'jics_sics_district', description: 'JICS/SICS District' }
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
      `SELECT id, name FROM roles WHERE name IN ('applicant', 'drcs_arcs_district', 'jics_sics_district')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const roleMap = roles.reduce((acc, r) => {
      acc[r.name] = r.id;
      return acc;
    }, {});

    const [assignedToColumn] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM module_workflows LIKE 'assigned_to'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    const assignedToIsJson = String(assignedToColumn?.Type || '')
      .toLowerCase()
      .includes('json');

    const assignToRole = (roleName) => {
      const roleId = roleMap[roleName];
      if (!roleId) {
        throw new Error(`Required role not found for renewal workflow: ${roleName}`);
      }
      // Schema migration defines UUID; some environments may have JSON instead.
      return assignedToIsJson ? JSON.stringify([roleId]) : roleId;
    };

    // Allow re-running the seeder safely
    await queryInterface.bulkDelete('module_workflows', { module_id: module }, {});

    // 5. Define Renewal Workflow Levels
    const renewalWorkflow = [
      // Level 0 – Applicant Upload Challan
      {
        id: uuidv4(),
        module_id: module,
        sequence: 1,
        allowed_role_id: JSON.stringify([roleMap['applicant']]),
        approval_status_id: statusMap['renewal_challan_uploaded'],
        approval_notification_template_id: templateMap['society_renewal_challan_uploaded'] || null,
        approval_send_to: 'single',
        approval_documents: null,
        reject_role_id: null,
        reject_status_id: null,
        reject_notification_template_id: null,
        reject_send_to: null,
        reject_documents: null,
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 1 – DRCS/ARCS District Review
      // If IN ORDER: Forward to JICS/SICS for examination
      // If NOT IN ORDER: Revert back to Applicant
      {
        id: uuidv4(),
        module_id: module,
        sequence: 2,
        allowed_role_id: JSON.stringify([roleMap['drcs_arcs_district']]),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['society_renewal_forwarded'] || null,
        approval_send_to: 'single',
        approval_documents: null,
        reject_role_id: JSON.stringify([roleMap['applicant']]),
        reject_status_id: statusMap['reverted'],
        reject_notification_template_id: templateMap['society_renewal_resubmitted'] || null,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignToRole('jics_sics_district'),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 2 – JICS/SICS District Examination
      // Examines the application and forwards back to DRCS/ARCS
      {
        id: uuidv4(),
        module_id: module,
        sequence: 3,
        allowed_role_id: JSON.stringify([roleMap['jics_sics_district']]),
        approval_status_id: statusMap['forwarded'],
        approval_notification_template_id: templateMap['society_renewal_forwarded'] || null,
        approval_send_to: 'single',
        approval_documents: JSON.stringify(['renewal_certificate']),
        reject_role_id: JSON.stringify([roleMap['drcs_arcs_district']]),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['society_renewal_resubmitted'] || null,
        reject_send_to: 'single',
        reject_documents: null,
        assigned_to: assignToRole('drcs_arcs_district'),
        is_hq: false,
        active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Level 3 – DRCS/ARCS District (Final) - Issue Certificate
      // Uploads and issues renewal certificate
      {
        id: uuidv4(),
        module_id: module,
        sequence: 4,
        allowed_role_id: JSON.stringify([roleMap['drcs_arcs_district']]),
        approval_status_id: statusMap['renewal_certificate_issued'],
        approval_notification_template_id: templateMap['society_renewal_certificate_issued'] || null,
        approval_send_to: 'all',
        approval_documents: null,
        reject_role_id: JSON.stringify([roleMap['jics_sics_district']]),
        reject_status_id: statusMap['rejected'],
        reject_notification_template_id: templateMap['society_renewal_resubmitted'] || null,
        reject_send_to: 'single',
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

    await queryInterface.bulkInsert('module_workflows', renewalWorkflow, {});
  },

  async down(queryInterface, Sequelize) {
    const module = await queryInterface.rawSelect('modules', {
      where: { key: 'SOCIETY_RENEWAL' }
    }, ['id']);

    if (module) {
      await queryInterface.bulkDelete('module_workflows', { module_id: module }, {});
    }
  }
};
