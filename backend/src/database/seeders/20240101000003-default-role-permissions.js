'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { v4: uuidv4 } = require('uuid');

    const generateRolePermissions = (roleId, permissionIds) =>
      permissionIds.map(permissionId => ({
        id: uuidv4(),
        role_id: roleId,
        permission_id: permissionId,
        created_at: new Date(),
      }));

    // All permission IDs
    const allPermissions = [
      // User permissions (only admin)
      '660e8400-e29b-41d4-a716-446655440001', // user.create
      '660e8400-e29b-41d4-a716-446655440002', // user.view
      '660e8400-e29b-41d4-a716-446655440003', // user.edit
      '660e8400-e29b-41d4-a716-446655440004', // user.delete

      // Registration permissions
      '660e8400-e29b-41d4-a716-446655440005', // registration.create
      '660e8400-e29b-41d4-a716-446655440006', // registration.view
      '660e8400-e29b-41d4-a716-446655440007', // registration.edit
      '660e8400-e29b-41d4-a716-446655440008', // registration.delete
      '660e8400-e29b-41d4-a716-446655440009', // registration.approve
      '660e8400-e29b-41d4-a716-446655440010', // registration.reject

      // Annual Return permissions
      '660e8400-e29b-41d4-a716-446655440011', // annual-return.create
      '660e8400-e29b-41d4-a716-446655440012', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440013', // annual-return.edit
      '660e8400-e29b-41d4-a716-446655440014', // annual-return.delete
      '660e8400-e29b-41d4-a716-446655440015', // annual-return.approve
      '660e8400-e29b-41d4-a716-446655440016', // annual-return.reject

      // Amendment permissions
      '660e8400-e29b-41d4-a716-446655440017', // amendment.create
      '660e8400-e29b-41d4-a716-446655440018', // amendment.view
      '660e8400-e29b-41d4-a716-446655440019', // amendment.edit
      '660e8400-e29b-41d4-a716-446655440020', // amendment.delete
      '660e8400-e29b-41d4-a716-446655440021', // amendment.approve
      '660e8400-e29b-41d4-a716-446655440022', // amendment.reject

      // Audit Request permissions
      '660e8400-e29b-41d4-a716-446655440023', // audit-request.create
      '660e8400-e29b-41d4-a716-446655440024', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440025', // audit-request.edit
      '660e8400-e29b-41d4-a716-446655440026', // audit-request.delete
      '660e8400-e29b-41d4-a716-446655440027', // audit-request.approve
      '660e8400-e29b-41d4-a716-446655440028', // audit-request.reject

      // Election Request permissions
      '660e8400-e29b-41d4-a716-446655440029', // election-request.create
      '660e8400-e29b-41d4-a716-446655440030', // election-request.view
      '660e8400-e29b-41d4-a716-446655440031', // election-request.edit
      '660e8400-e29b-41d4-a716-446655440032', // election-request.delete
      '660e8400-e29b-41d4-a716-446655440033', // election-request.approve
      '660e8400-e29b-41d4-a716-446655440034', // election-request.reject

      // Liquidation permissions
      '660e8400-e29b-41d4-a716-446655440035', // liquidation.create
      '660e8400-e29b-41d4-a716-446655440036', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440037', // liquidation.edit
      '660e8400-e29b-41d4-a716-446655440038', // liquidation.delete
      '660e8400-e29b-41d4-a716-446655440039', // liquidation.approve
      '660e8400-e29b-41d4-a716-446655440040', // liquidation.reject

      // Inquiry permissions
      '660e8400-e29b-41d4-a716-446655440041', // inquiry.create
      '660e8400-e29b-41d4-a716-446655440042', // inquiry.view
      '660e8400-e29b-41d4-a716-446655440043', // inquiry.edit
      '660e8400-e29b-41d4-a716-446655440044', // inquiry.delete
      '660e8400-e29b-41d4-a716-446655440045', // inquiry.approve
      '660e8400-e29b-41d4-a716-446655440046', // inquiry.reject

      // Appeal permissions
      '660e8400-e29b-41d4-a716-446655440047', // appeal.create
      '660e8400-e29b-41d4-a716-446655440048', // appeal.view
      '660e8400-e29b-41d4-a716-446655440049', // appeal.edit
      '660e8400-e29b-41d4-a716-446655440050', // appeal.delete
      '660e8400-e29b-41d4-a716-446655440051', // appeal.approve
      '660e8400-e29b-41d4-a716-446655440052', // appeal.reject

      // Society permissions
      '660e8400-e29b-41d4-a716-446655440053', // society.create
      '660e8400-e29b-41d4-a716-446655440054', // society.view
      '660e8400-e29b-41d4-a716-446655440055', // society.edit
      '660e8400-e29b-41d4-a716-446655440056', // society.delete
      '660e8400-e29b-41d4-a716-446655440057', // society.approve
      '660e8400-e29b-41d4-a716-446655440058', // society.reject

      // Hearing permissions (registrar only)
      '660e8400-e29b-41d4-a716-446655440059', // hearing.apply
      '660e8400-e29b-41d4-a716-446655440060'  // hearing.resolve
    ];

    // Applicant permissions (society create, view, edit + Annual Return create, view, edit)
    const applicantPermissions = [
      '660e8400-e29b-41d4-a716-446655440053', // society.create
      '660e8400-e29b-41d4-a716-446655440054', // society.view
      '660e8400-e29b-41d4-a716-446655440055', // society.edit
      '660e8400-e29b-41d4-a716-446655440011', // annual-return.create
      '660e8400-e29b-41d4-a716-446655440012', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440013'  // annual-return.edit
    ];

    // View permissions for all features except society (for field_inspector, dealing_assistant, joint_registrar)
    const viewOnlyPermissions = [
      '660e8400-e29b-41d4-a716-446655440006', // registration.view
      '660e8400-e29b-41d4-a716-446655440012', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440018', // amendment.view
      '660e8400-e29b-41d4-a716-446655440024', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440030', // election-request.view
      '660e8400-e29b-41d4-a716-446655440036', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440042', // inquiry.view
      '660e8400-e29b-41d4-a716-446655440048'  // appeal.view
    ];

    // Approve/Reject permissions for all features (for deputy_registrar, senior_inspector, registrar)
    const approveRejectPermissions = [
      // Registration approve/reject
      '660e8400-e29b-41d4-a716-446655440009', // registration.approve
      '660e8400-e29b-41d4-a716-446655440010', // registration.reject
      // Annual Return approve/reject
      '660e8400-e29b-41d4-a716-446655440015', // annual-return.approve
      '660e8400-e29b-41d4-a716-446655440016', // annual-return.reject
      // Amendment approve/reject
      '660e8400-e29b-41d4-a716-446655440021', // amendment.approve
      '660e8400-e29b-41d4-a716-446655440022', // amendment.reject
      // Audit Request approve/reject
      '660e8400-e29b-41d4-a716-446655440027', // audit-request.approve
      '660e8400-e29b-41d4-a716-446655440028', // audit-request.reject
      // Election Request approve/reject
      '660e8400-e29b-41d4-a716-446655440033', // election-request.approve
      '660e8400-e29b-41d4-a716-446655440034', // election-request.reject
      // Liquidation approve/reject
      '660e8400-e29b-41d4-a716-446655440039', // liquidation.approve
      '660e8400-e29b-41d4-a716-446655440040', // liquidation.reject
      // Inquiry approve/reject
      '660e8400-e29b-41d4-a716-446655440045', // inquiry.approve
      '660e8400-e29b-41d4-a716-446655440046', // inquiry.reject
      // Appeal approve/reject
      '660e8400-e29b-41d4-a716-446655440051', // appeal.approve
      '660e8400-e29b-41d4-a716-446655440052', // appeal.reject
      // Society approve/reject
      '660e8400-e29b-41d4-a716-446655440057', // society.approve
      '660e8400-e29b-41d4-a716-446655440058'  // society.reject
    ];

    const roleRows = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const roleIdByName = new Map((roleRows || []).map(r => [r.name, r.id]));

    const assignments = [
      { roleName: 'admin', permissions: allPermissions },
      { roleName: 'applicant', permissions: applicantPermissions },

      // View-only style roles
      { roleName: 'dept_jics_sics', permissions: viewOnlyPermissions },
      { roleName: 'drcs_arcs_auditor', permissions: viewOnlyPermissions },
      { roleName: 'jics_sics_auditor', permissions: viewOnlyPermissions },
      { roleName: 'jics_sics_liquidator', permissions: viewOnlyPermissions },

      // Roles that typically act on workflows
      { roleName: 'drcs_arcs_district', permissions: approveRejectPermissions },
      { roleName: 'drcs_arcs_hq', permissions: approveRejectPermissions },
      { roleName: 'jics_sics_district', permissions: approveRejectPermissions },
      { roleName: 'jics_sics_hq', permissions: approveRejectPermissions },
      { roleName: 'jt_rcs_district', permissions: approveRejectPermissions },
      { roleName: 'jt_rcs_hq', permissions: approveRejectPermissions },
      { roleName: 'rcs_district', permissions: approveRejectPermissions },
    ];

    const rolePermissions = [];
    for (const a of assignments) {
      const roleId = roleIdByName.get(a.roleName);
      if (!roleId) continue;
      rolePermissions.push(...generateRolePermissions(roleId, a.permissions));
    }

    if (rolePermissions.length === 0) return;

    const existingPairs = await queryInterface.sequelize.query(
      `SELECT role_id, permission_id FROM role_permissions`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingKey = new Set((existingPairs || []).map(r => `${r.role_id}:${r.permission_id}`));
    const toInsert = rolePermissions.filter(rp => !existingKey.has(`${rp.role_id}:${rp.permission_id}`));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('role_permissions', toInsert, {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('role_permissions', null, {});
  }
}; 