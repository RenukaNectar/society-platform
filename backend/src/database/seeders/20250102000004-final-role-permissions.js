'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, delete existing role_permissions to avoid conflicts
    await queryInterface.bulkDelete('role_permissions', null, {});

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

      // Permission permissions (only admin)
      '660e8400-e29b-41d4-a716-446655440005', // permission.create
      '660e8400-e29b-41d4-a716-446655440006', // permission.view
      '660e8400-e29b-41d4-a716-446655440007', // permission.edit
      '660e8400-e29b-41d4-a716-446655440008', // permission.delete

      // Society permissions
      '660e8400-e29b-41d4-a716-446655440009', // society.create
      '660e8400-e29b-41d4-a716-446655440010', // society.view
      '660e8400-e29b-41d4-a716-446655440011', // society.edit
      '660e8400-e29b-41d4-a716-446655440012', // society.delete
      '660e8400-e29b-41d4-a716-446655440013', // society.approve

      // Societies permissions
      '660e8400-e29b-41d4-a716-446655440014', // societies.create
      '660e8400-e29b-41d4-a716-446655440015', // societies.view
      '660e8400-e29b-41d4-a716-446655440016', // societies.edit
      '660e8400-e29b-41d4-a716-446655440017', // societies.delete
      '660e8400-e29b-41d4-a716-446655440018', // societies.approve
      '660e8400-e29b-41d4-a716-446655440019', // societies.reject

      // Annual Return permissions
      '660e8400-e29b-41d4-a716-446655440020', // annual-return.create
      '660e8400-e29b-41d4-a716-446655440021', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440022', // annual-return.edit
      '660e8400-e29b-41d4-a716-446655440023', // annual-return.delete
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.approve
      '660e8400-e29b-41d4-a716-446655440025', // annual-return.reject

      // Amendment permissions
      '660e8400-e29b-41d4-a716-446655440026', // amendment.create
      '660e8400-e29b-41d4-a716-446655440027', // amendment.view
      '660e8400-e29b-41d4-a716-446655440028', // amendment.edit
      '660e8400-e29b-41d4-a716-446655440029', // amendment.delete
      '660e8400-e29b-41d4-a716-446655440030', // amendment.approve
      '660e8400-e29b-41d4-a716-446655440031', // amendment.reject

      // Election Request permissions
      '660e8400-e29b-41d4-a716-446655440032', // election-request.create
      '660e8400-e29b-41d4-a716-446655440033', // election-request.view
      '660e8400-e29b-41d4-a716-446655440034', // election-request.edit
      '660e8400-e29b-41d4-a716-446655440035', // election-request.delete
      '660e8400-e29b-41d4-a716-446655440036', // election-request.approve
      '660e8400-e29b-41d4-a716-446655440037', // election-request.reject

      // Audit Request permissions
      '660e8400-e29b-41d4-a716-446655440038', // audit-request.create
      '660e8400-e29b-41d4-a716-446655440039', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440040', // audit-request.edit
      '660e8400-e29b-41d4-a716-446655440041', // audit-request.delete
      '660e8400-e29b-41d4-a716-446655440042', // audit-request.approve
      '660e8400-e29b-41d4-a716-446655440043', // audit-request.reject

      // Liquidation permissions
      '660e8400-e29b-41d4-a716-446655440044', // liquidation.create
      '660e8400-e29b-41d4-a716-446655440045', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440046', // liquidation.edit
      '660e8400-e29b-41d4-a716-446655440047', // liquidation.delete
      '660e8400-e29b-41d4-a716-446655440048', // liquidation.approve
      '660e8400-e29b-41d4-a716-446655440049', // liquidation.reject

      // Appeal permissions
      '660e8400-e29b-41d4-a716-446655440050', // appeal.create
      '660e8400-e29b-41d4-a716-446655440051', // appeal.view
      '660e8400-e29b-41d4-a716-446655440052', // appeal.edit
      '660e8400-e29b-41d4-a716-446655440053', // appeal.delete
      '660e8400-e29b-41d4-a716-446655440054', // appeal.approve
      '660e8400-e29b-41d4-a716-446655440055', // appeal.reject

      // Settings permissions
      '660e8400-e29b-41d4-a716-446655440056', // settings.create
      '660e8400-e29b-41d4-a716-446655440057', // settings.view
      '660e8400-e29b-41d4-a716-446655440058', // settings.edit
      '660e8400-e29b-41d4-a716-446655440059', // settings.delete

      // Dashboard permissions
      '660e8400-e29b-41d4-a716-446655440060', // dashboard.view

      // Hearing permissions
      '660e8400-e29b-41d4-a716-446655440061', // hearing.apply

      // Inquiry and Inspection permissions
      '660e8400-e29b-41d4-a716-446655440062', // inquiry-inspection.create
      '660e8400-e29b-41d4-a716-446655440063', // inquiry-inspection.view
      '660e8400-e29b-41d4-a716-446655440064', // inquiry-inspection.edit
      '660e8400-e29b-41d4-a716-446655440065', // inquiry-inspection.delete
      '660e8400-e29b-41d4-a716-446655440066', // inquiry-inspection.approve
      '660e8400-e29b-41d4-a716-446655440067'  // inquiry-inspection.reject
    ];

    // Admin permissions (all permissions)
    const adminPermissions = allPermissions;

    // Registrar permissions (based on image)
    const registrarPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440015', // societies.view
      '660e8400-e29b-41d4-a716-446655440018', // societies.approve
      '660e8400-e29b-41d4-a716-446655440019', // societies.reject
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440021', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.approve
      '660e8400-e29b-41d4-a716-446655440025', // annual-return.reject
      // Amendment
      '660e8400-e29b-41d4-a716-446655440027', // amendment.view
      '660e8400-e29b-41d4-a716-446655440030', // amendment.approve
      '660e8400-e29b-41d4-a716-446655440031', // amendment.reject
      // Election Request
      '660e8400-e29b-41d4-a716-446655440033', // election-request.view
      '660e8400-e29b-41d4-a716-446655440036', // election-request.approve
      '660e8400-e29b-41d4-a716-446655440037', // election-request.reject
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440039', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440042', // audit-request.approve
      '660e8400-e29b-41d4-a716-446655440043', // audit-request.reject
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440045', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440048', // liquidation.approve
      '660e8400-e29b-41d4-a716-446655440049', // liquidation.reject
      // Appeal
      '660e8400-e29b-41d4-a716-446655440051', // appeal.view
      '660e8400-e29b-41d4-a716-446655440054', // appeal.approve
      '660e8400-e29b-41d4-a716-446655440055', // appeal.reject
      // Settings
      '660e8400-e29b-41d4-a716-446655440057', // settings.view
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440060', // dashboard.view
      // Hearing
      '660e8400-e29b-41d4-a716-446655440061', // hearing.apply
      // Inquiry and Inspection
      '660e8400-e29b-41d4-a716-446655440063', // inquiry-inspection.view
      '660e8400-e29b-41d4-a716-446655440066', // inquiry-inspection.approve
      '660e8400-e29b-41d4-a716-446655440067'  // inquiry-inspection.reject
    ];

    // Joint Registrar permissions (view only for most features)
    const jointRegistrarPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440015', // societies.view
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440021', // annual-return.view
      // Amendment
      '660e8400-e29b-41d4-a716-446655440027', // amendment.view
      // Election Request
      '660e8400-e29b-41d4-a716-446655440033', // election-request.view
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440039', // audit-request.view
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440045', // liquidation.view
      // Appeal
      '660e8400-e29b-41d4-a716-446655440051', // appeal.view
      // Settings
      '660e8400-e29b-41d4-a716-446655440057', // settings.view
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440060', // dashboard.view
      // Inquiry and Inspection
      '660e8400-e29b-41d4-a716-446655440063'  // inquiry-inspection.view
    ];

    // Senior Inspector permissions (approve/reject for most features)
    const seniorInspectorPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440015', // societies.view
      '660e8400-e29b-41d4-a716-446655440018', // societies.approve
      '660e8400-e29b-41d4-a716-446655440019', // societies.reject
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440021', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.approve
      '660e8400-e29b-41d4-a716-446655440025', // annual-return.reject
      // Amendment
      '660e8400-e29b-41d4-a716-446655440027', // amendment.view
      '660e8400-e29b-41d4-a716-446655440030', // amendment.approve
      '660e8400-e29b-41d4-a716-446655440031', // amendment.reject
      // Election Request
      '660e8400-e29b-41d4-a716-446655440033', // election-request.view
      '660e8400-e29b-41d4-a716-446655440036', // election-request.approve
      '660e8400-e29b-41d4-a716-446655440037', // election-request.reject
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440039', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440042', // audit-request.approve
      '660e8400-e29b-41d4-a716-446655440043', // audit-request.reject
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440045', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440048', // liquidation.approve
      '660e8400-e29b-41d4-a716-446655440049', // liquidation.reject
      // Appeal
      '660e8400-e29b-41d4-a716-446655440051', // appeal.view
      '660e8400-e29b-41d4-a716-446655440054', // appeal.approve
      '660e8400-e29b-41d4-a716-446655440055', // appeal.reject
      // Settings
      '660e8400-e29b-41d4-a716-446655440057', // settings.view
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440060', // dashboard.view
      // Inquiry and Inspection
      '660e8400-e29b-41d4-a716-446655440063', // inquiry-inspection.view
      '660e8400-e29b-41d4-a716-446655440066', // inquiry-inspection.approve
      '660e8400-e29b-41d4-a716-446655440067'  // inquiry-inspection.reject
    ];

    // Deputy Registrar permissions (same as Senior Inspector)
    const deputyRegistrarPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440015', // societies.view
      '660e8400-e29b-41d4-a716-446655440018', // societies.approve
      '660e8400-e29b-41d4-a716-446655440019', // societies.reject
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440021', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.approve
      '660e8400-e29b-41d4-a716-446655440025', // annual-return.reject
      // Amendment
      '660e8400-e29b-41d4-a716-446655440027', // amendment.view
      '660e8400-e29b-41d4-a716-446655440030', // amendment.approve
      '660e8400-e29b-41d4-a716-446655440031', // amendment.reject
      // Election Request
      '660e8400-e29b-41d4-a716-446655440033', // election-request.view
      '660e8400-e29b-41d4-a716-446655440036', // election-request.approve
      '660e8400-e29b-41d4-a716-446655440037', // election-request.reject
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440039', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440042', // audit-request.approve
      '660e8400-e29b-41d4-a716-446655440043', // audit-request.reject
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440045', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440048', // liquidation.approve
      '660e8400-e29b-41d4-a716-446655440049', // liquidation.reject
      // Appeal
      '660e8400-e29b-41d4-a716-446655440051', // appeal.view
      '660e8400-e29b-41d4-a716-446655440054', // appeal.approve
      '660e8400-e29b-41d4-a716-446655440055', // appeal.reject
      // Settings
      '660e8400-e29b-41d4-a716-446655440057', // settings.view
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440060', // dashboard.view
      // Inquiry and Inspection
      '660e8400-e29b-41d4-a716-446655440063', // inquiry-inspection.view
      '660e8400-e29b-41d4-a716-446655440066', // inquiry-inspection.approve
      '660e8400-e29b-41d4-a716-446655440067'  // inquiry-inspection.reject
    ];

    // Dealing Assistant permissions (view only)
    const dealingAssistantPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440015', // societies.view
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440021', // annual-return.view
      // Amendment
      '660e8400-e29b-41d4-a716-446655440027', // amendment.view
      // Election Request
      '660e8400-e29b-41d4-a716-446655440033', // election-request.view
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440039', // audit-request.view
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440045', // liquidation.view
      // Appeal
      '660e8400-e29b-41d4-a716-446655440051', // appeal.view
      // Settings
      '660e8400-e29b-41d4-a716-446655440057', // settings.view
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440060', // dashboard.view
      // Inquiry and Inspection
      '660e8400-e29b-41d4-a716-446655440063'  // inquiry-inspection.view
    ];

    // Field Inspector permissions (view only)
    const fieldInspectorPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440015', // societies.view
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440021', // annual-return.view
      // Amendment
      '660e8400-e29b-41d4-a716-446655440027', // amendment.view
      // Election Request
      '660e8400-e29b-41d4-a716-446655440033', // election-request.view
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440039', // audit-request.view
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440045', // liquidation.view
      // Appeal
      '660e8400-e29b-41d4-a716-446655440051', // appeal.view
      // Settings
      '660e8400-e29b-41d4-a716-446655440057', // settings.view
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440060', // dashboard.view
      // Inquiry and Inspection
      '660e8400-e29b-41d4-a716-446655440063'  // inquiry-inspection.view
    ];

    // Applicant permissions (create, edit, view for most features)
    const applicantPermissions = [
      // Society
      '660e8400-e29b-41d4-a716-446655440009', // society.create
      '660e8400-e29b-41d4-a716-446655440010', // society.view
      '660e8400-e29b-41d4-a716-446655440011', // society.edit
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440020', // annual-return.create
      '660e8400-e29b-41d4-a716-446655440021', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440022', // annual-return.edit
      // Amendment
      '660e8400-e29b-41d4-a716-446655440026', // amendment.create
      '660e8400-e29b-41d4-a716-446655440027', // amendment.view
      '660e8400-e29b-41d4-a716-446655440028', // amendment.edit
      // Election Request
      '660e8400-e29b-41d4-a716-446655440032', // election-request.create
      '660e8400-e29b-41d4-a716-446655440033', // election-request.view
      '660e8400-e29b-41d4-a716-446655440034', // election-request.edit
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440038', // audit-request.create
      '660e8400-e29b-41d4-a716-446655440039', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440040', // audit-request.edit
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440044', // liquidation.create
      '660e8400-e29b-41d4-a716-446655440045', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440046', // liquidation.edit
      // Appeal
      '660e8400-e29b-41d4-a716-446655440050', // appeal.create
      '660e8400-e29b-41d4-a716-446655440051', // appeal.view
      '660e8400-e29b-41d4-a716-446655440052', // appeal.edit
      // Inquiry and Inspection
      '660e8400-e29b-41d4-a716-446655440062', // inquiry-inspection.create
      '660e8400-e29b-41d4-a716-446655440063', // inquiry-inspection.view
      '660e8400-e29b-41d4-a716-446655440064'  // inquiry-inspection.edit
    ];

    const roleRows = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const roleIdByName = new Map((roleRows || []).map(r => [r.name, r.id]));

    const assignments = [
      { roleName: 'admin', permissions: adminPermissions },
      { roleName: 'applicant', permissions: applicantPermissions },

      // fallback mappings for current role set in this project
      { roleName: 'dept_jics_sics', permissions: dealingAssistantPermissions },
      { roleName: 'drcs_arcs_auditor', permissions: fieldInspectorPermissions },
      { roleName: 'jics_sics_auditor', permissions: fieldInspectorPermissions },
      { roleName: 'jics_sics_liquidator', permissions: dealingAssistantPermissions },

      { roleName: 'drcs_arcs_district', permissions: deputyRegistrarPermissions },
      { roleName: 'drcs_arcs_hq', permissions: registrarPermissions },
      { roleName: 'jics_sics_district', permissions: deputyRegistrarPermissions },
      { roleName: 'jics_sics_hq', permissions: registrarPermissions },
      { roleName: 'jt_rcs_district', permissions: seniorInspectorPermissions },
      { roleName: 'jt_rcs_hq', permissions: seniorInspectorPermissions },
      { roleName: 'rcs_district', permissions: registrarPermissions },
    ];

    const rolePermissions = [];
    for (const a of assignments) {
      const roleId = roleIdByName.get(a.roleName);
      if (!roleId) continue;
      rolePermissions.push(...generateRolePermissions(roleId, a.permissions));
    }

    if (rolePermissions.length > 0) {
      await queryInterface.bulkInsert('role_permissions', rolePermissions, {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('role_permissions', null, {});
  }
}; 