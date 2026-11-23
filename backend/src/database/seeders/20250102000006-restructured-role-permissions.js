'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, delete existing role_permissions to avoid conflicts
    await queryInterface.bulkDelete('role_permissions', null, {});

    // Helper function to generate role-permission mappings
    const generateRolePermissions = (roleId, permissionIds) => {
      return permissionIds.map((permissionId, index) => ({
        id: require('crypto').randomUUID(),
        role_id: roleId,
        permission_id: permissionId,
        created_at: new Date()
      }));
    };

    // All permission IDs based on the table
    const allPermissions = [
      // User permissions (only admin - role 1)
      '660e8400-e29b-41d4-a716-446655440001', // user.create
      '660e8400-e29b-41d4-a716-446655440002', // user.view
      '660e8400-e29b-41d4-a716-446655440003', // user.edit
      '660e8400-e29b-41d4-a716-446655440004', // user.delete

      // Permission permissions (only admin - role 1)
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
      '660e8400-e29b-41d4-a716-446655440014', // society.reject
      '660e8400-e29b-41d4-a716-446655440015', // society.hearing

      // Societies permissions
      '660e8400-e29b-41d4-a716-446655440016', // societies.create
      '660e8400-e29b-41d4-a716-446655440017', // societies.view
      '660e8400-e29b-41d4-a716-446655440018', // societies.edit
      '660e8400-e29b-41d4-a716-446655440019', // societies.delete
      '660e8400-e29b-41d4-a716-446655440020', // societies.approve
      '660e8400-e29b-41d4-a716-446655440021', // societies.reject
      '660e8400-e29b-41d4-a716-446655440022', // societies.hearing

      // Annual Return permissions
      '660e8400-e29b-41d4-a716-446655440023', // annual-return.create
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440025', // annual-return.edit
      '660e8400-e29b-41d4-a716-446655440026', // annual-return.delete
      '660e8400-e29b-41d4-a716-446655440027', // annual-return.approve
      '660e8400-e29b-41d4-a716-446655440028', // annual-return.reject
      '660e8400-e29b-41d4-a716-446655440029', // annual-return.hearing

      // Amendment permissions
      '660e8400-e29b-41d4-a716-446655440030', // amendment.create
      '660e8400-e29b-41d4-a716-446655440031', // amendment.view
      '660e8400-e29b-41d4-a716-446655440032', // amendment.edit
      '660e8400-e29b-41d4-a716-446655440033', // amendment.delete
      '660e8400-e29b-41d4-a716-446655440034', // amendment.approve
      '660e8400-e29b-41d4-a716-446655440035', // amendment.reject
      '660e8400-e29b-41d4-a716-446655440036', // amendment.hearing

      // Election Request permissions
      '660e8400-e29b-41d4-a716-446655440037', // election-request.create
      '660e8400-e29b-41d4-a716-446655440038', // election-request.view
      '660e8400-e29b-41d4-a716-446655440039', // election-request.edit
      '660e8400-e29b-41d4-a716-446655440040', // election-request.delete
      '660e8400-e29b-41d4-a716-446655440041', // election-request.approve
      '660e8400-e29b-41d4-a716-446655440042', // election-request.reject
      '660e8400-e29b-41d4-a716-446655440043', // election-request.hearing

      // Audit Request permissions
      '660e8400-e29b-41d4-a716-446655440044', // audit-request.create
      '660e8400-e29b-41d4-a716-446655440045', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440046', // audit-request.edit
      '660e8400-e29b-41d4-a716-446655440047', // audit-request.delete
      '660e8400-e29b-41d4-a716-446655440048', // audit-request.approve
      '660e8400-e29b-41d4-a716-446655440049', // audit-request.reject
      '660e8400-e29b-41d4-a716-446655440050', // audit-request.hearing

      // Inquiry Inspection permissions
      '660e8400-e29b-41d4-a716-446655440051', // inquiry-inspection.create
      '660e8400-e29b-41d4-a716-446655440052', // inquiry-inspection.view
      '660e8400-e29b-41d4-a716-446655440053', // inquiry-inspection.edit
      '660e8400-e29b-41d4-a716-446655440054', // inquiry-inspection.delete
      '660e8400-e29b-41d4-a716-446655440055', // inquiry-inspection.approve
      '660e8400-e29b-41d4-a716-446655440056', // inquiry-inspection.reject
      '660e8400-e29b-41d4-a716-446655440057', // inquiry-inspection.hearing

      // Liquidation permissions
      '660e8400-e29b-41d4-a716-446655440058', // liquidation.create
      '660e8400-e29b-41d4-a716-446655440059', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440060', // liquidation.edit
      '660e8400-e29b-41d4-a716-446655440061', // liquidation.delete
      '660e8400-e29b-41d4-a716-446655440062', // liquidation.approve
      '660e8400-e29b-41d4-a716-446655440063', // liquidation.reject
      '660e8400-e29b-41d4-a716-446655440064', // liquidation.hearing

      // Appeal permissions
      '660e8400-e29b-41d4-a716-446655440065', // appeal.create
      '660e8400-e29b-41d4-a716-446655440066', // appeal.view
      '660e8400-e29b-41d4-a716-446655440067', // appeal.edit
      '660e8400-e29b-41d4-a716-446655440068', // appeal.delete
      '660e8400-e29b-41d4-a716-446655440069', // appeal.approve
      '660e8400-e29b-41d4-a716-446655440070', // appeal.reject
      '660e8400-e29b-41d4-a716-446655440071', // appeal.hearing

      // Settings permissions
      '660e8400-e29b-41d4-a716-446655440072', // settings.create
      '660e8400-e29b-41d4-a716-446655440073', // settings.view
      '660e8400-e29b-41d4-a716-446655440074', // settings.edit
      '660e8400-e29b-41d4-a716-446655440075', // settings.delete

      // Dashboard permissions
      '660e8400-e29b-41d4-a716-446655440076'  // dashboard.view
    ];

    const roleRows = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const roleIdByName = new Map((roleRows || []).map(r => [r.name, r.id]));

    // Admin permissions (all permissions - role 1)
    const adminPermissions = allPermissions;

    // Registrar permissions (role 2)
    const registrarPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440017', // societies.view
      '660e8400-e29b-41d4-a716-446655440020', // societies.approve
      '660e8400-e29b-41d4-a716-446655440021', // societies.reject
      '660e8400-e29b-41d4-a716-446655440022', // societies.hearing
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440027', // annual-return.approve
      '660e8400-e29b-41d4-a716-446655440028', // annual-return.reject
      '660e8400-e29b-41d4-a716-446655440029', // annual-return.hearing
      // Amendment
      '660e8400-e29b-41d4-a716-446655440031', // amendment.view
      '660e8400-e29b-41d4-a716-446655440034', // amendment.approve
      '660e8400-e29b-41d4-a716-446655440035', // amendment.reject
      '660e8400-e29b-41d4-a716-446655440036', // amendment.hearing
      // Election Request
      '660e8400-e29b-41d4-a716-446655440038', // election-request.view
      '660e8400-e29b-41d4-a716-446655440041', // election-request.approve
      '660e8400-e29b-41d4-a716-446655440042', // election-request.reject
      '660e8400-e29b-41d4-a716-446655440043', // election-request.hearing
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440045', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440048', // audit-request.approve
      '660e8400-e29b-41d4-a716-446655440049', // audit-request.reject
      '660e8400-e29b-41d4-a716-446655440050', // audit-request.hearing
      // Inquiry Inspection
      '660e8400-e29b-41d4-a716-446655440052', // inquiry-inspection.view
      '660e8400-e29b-41d4-a716-446655440055', // inquiry-inspection.approve
      '660e8400-e29b-41d4-a716-446655440056', // inquiry-inspection.reject
      '660e8400-e29b-41d4-a716-446655440057', // inquiry-inspection.hearing
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440059', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440062', // liquidation.approve
      '660e8400-e29b-41d4-a716-446655440063', // liquidation.reject
      '660e8400-e29b-41d4-a716-446655440064', // liquidation.hearing
      // Appeal
      '660e8400-e29b-41d4-a716-446655440066', // appeal.view
      '660e8400-e29b-41d4-a716-446655440069', // appeal.approve
      '660e8400-e29b-41d4-a716-446655440070', // appeal.reject
      '660e8400-e29b-41d4-a716-446655440071', // appeal.hearing
      // Settings
      '660e8400-e29b-41d4-a716-446655440073', // settings.view
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440076'  // dashboard.view
    ];

    // Joint Registrar permissions (role 3)
    const jointRegistrarPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440017', // societies.view
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.view
      // Amendment
      '660e8400-e29b-41d4-a716-446655440031', // amendment.view
      // Election Request
      '660e8400-e29b-41d4-a716-446655440038', // election-request.view
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440045', // audit-request.view
      // Inquiry Inspection
      '660e8400-e29b-41d4-a716-446655440052', // inquiry-inspection.view
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440059', // liquidation.view
      // Appeal
      '660e8400-e29b-41d4-a716-446655440066', // appeal.view
      // Settings
      '660e8400-e29b-41d4-a716-446655440073', // settings.view
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440076'  // dashboard.view
    ];

    // Senior Inspector permissions (role 4)
    const seniorInspectorPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440017', // societies.view
      '660e8400-e29b-41d4-a716-446655440020', // societies.approve
      '660e8400-e29b-41d4-a716-446655440021', // societies.reject
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440027', // annual-return.approve
      '660e8400-e29b-41d4-a716-446655440028', // annual-return.reject
      // Amendment
      '660e8400-e29b-41d4-a716-446655440031', // amendment.view
      '660e8400-e29b-41d4-a716-446655440034', // amendment.approve
      '660e8400-e29b-41d4-a716-446655440035', // amendment.reject
      // Election Request
      '660e8400-e29b-41d4-a716-446655440038', // election-request.view
      '660e8400-e29b-41d4-a716-446655440041', // election-request.approve
      '660e8400-e29b-41d4-a716-446655440042', // election-request.reject
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440045', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440048', // audit-request.approve
      '660e8400-e29b-41d4-a716-446655440049', // audit-request.reject
      // Inquiry Inspection
      '660e8400-e29b-41d4-a716-446655440052', // inquiry-inspection.view
      '660e8400-e29b-41d4-a716-446655440055', // inquiry-inspection.approve
      '660e8400-e29b-41d4-a716-446655440056', // inquiry-inspection.reject
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440059', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440062', // liquidation.approve
      '660e8400-e29b-41d4-a716-446655440063', // liquidation.reject
      // Appeal
      '660e8400-e29b-41d4-a716-446655440066', // appeal.view
      '660e8400-e29b-41d4-a716-446655440069', // appeal.approve
      '660e8400-e29b-41d4-a716-446655440070', // appeal.reject
      // Settings
      '660e8400-e29b-41d4-a716-446655440073', // settings.view
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440076'  // dashboard.view
    ];

    // Deputy Registrar permissions (role 5)
    const deputyRegistrarPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440017', // societies.view
      '660e8400-e29b-41d4-a716-446655440020', // societies.approve
      '660e8400-e29b-41d4-a716-446655440021', // societies.reject
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440027', // annual-return.approve
      '660e8400-e29b-41d4-a716-446655440028', // annual-return.reject
      // Amendment
      '660e8400-e29b-41d4-a716-446655440031', // amendment.view
      '660e8400-e29b-41d4-a716-446655440034', // amendment.approve
      '660e8400-e29b-41d4-a716-446655440035', // amendment.reject
      // Election Request
      '660e8400-e29b-41d4-a716-446655440038', // election-request.view
      '660e8400-e29b-41d4-a716-446655440041', // election-request.approve
      '660e8400-e29b-41d4-a716-446655440042', // election-request.reject
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440045', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440048', // audit-request.approve
      '660e8400-e29b-41d4-a716-446655440049', // audit-request.reject
      // Inquiry Inspection
      '660e8400-e29b-41d4-a716-446655440052', // inquiry-inspection.view
      '660e8400-e29b-41d4-a716-446655440055', // inquiry-inspection.approve
      '660e8400-e29b-41d4-a716-446655440056', // inquiry-inspection.reject
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440059', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440062', // liquidation.approve
      '660e8400-e29b-41d4-a716-446655440063', // liquidation.reject
      // Appeal
      '660e8400-e29b-41d4-a716-446655440066', // appeal.view
      '660e8400-e29b-41d4-a716-446655440069', // appeal.approve
      '660e8400-e29b-41d4-a716-446655440070', // appeal.reject
      // Settings
      '660e8400-e29b-41d4-a716-446655440073', // settings.view
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440076'  // dashboard.view
    ];

    // Dealing Assistant permissions (role 6)
    const dealingAssistantPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440017', // societies.view
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.view
      // Amendment
      '660e8400-e29b-41d4-a716-446655440031', // amendment.view
      // Election Request
      '660e8400-e29b-41d4-a716-446655440038', // election-request.view
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440045', // audit-request.view
      // Inquiry Inspection
      '660e8400-e29b-41d4-a716-446655440052', // inquiry-inspection.view
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440059', // liquidation.view
      // Appeal
      '660e8400-e29b-41d4-a716-446655440066', // appeal.view
      // Settings
      '660e8400-e29b-41d4-a716-446655440073', // settings.view
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440076'  // dashboard.view
    ];

    // Field Inspector permissions (role 7) - View for all features, Approve/Reject for most except user, permissions, society
    const fieldInspectorPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440017', // societies.view
      '660e8400-e29b-41d4-a716-446655440020', // societies.approve
      '660e8400-e29b-41d4-a716-446655440021', // societies.reject
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440027', // annual-return.approve
      '660e8400-e29b-41d4-a716-446655440028', // annual-return.reject
      // Amendment
      '660e8400-e29b-41d4-a716-446655440031', // amendment.view
      '660e8400-e29b-41d4-a716-446655440034', // amendment.approve
      '660e8400-e29b-41d4-a716-446655440035', // amendment.reject
      // Election Request
      '660e8400-e29b-41d4-a716-446655440038', // election-request.view
      '660e8400-e29b-41d4-a716-446655440041', // election-request.approve
      '660e8400-e29b-41d4-a716-446655440042', // election-request.reject
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440045', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440048', // audit-request.approve
      '660e8400-e29b-41d4-a716-446655440049', // audit-request.reject
      // Inquiry Inspection
      '660e8400-e29b-41d4-a716-446655440052', // inquiry-inspection.view
      '660e8400-e29b-41d4-a716-446655440055', // inquiry-inspection.approve
      '660e8400-e29b-41d4-a716-446655440056', // inquiry-inspection.reject
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440059', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440062', // liquidation.approve
      '660e8400-e29b-41d4-a716-446655440063', // liquidation.reject
      // Appeal
      '660e8400-e29b-41d4-a716-446655440066', // appeal.view
      '660e8400-e29b-41d4-a716-446655440069', // appeal.approve
      '660e8400-e29b-41d4-a716-446655440070', // appeal.reject
      // Settings
      '660e8400-e29b-41d4-a716-446655440073', // settings.view
      '660e8400-e29b-41d4-a716-446655440075', // settings.delete
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440076'  // dashboard.view
    ];

    // Applicant permissions (role 8)
    const applicantPermissions = [
      // Society
      '660e8400-e29b-41d4-a716-446655440009', // society.create
      '660e8400-e29b-41d4-a716-446655440010', // society.view
      '660e8400-e29b-41d4-a716-446655440011', // society.edit
      // Societies
      '660e8400-e29b-41d4-a716-446655440017', // societies.view
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440023', // annual-return.create
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.view
      '660e8400-e29b-41d4-a716-446655440025', // annual-return.edit
      // Amendment
      '660e8400-e29b-41d4-a716-446655440030', // amendment.create
      '660e8400-e29b-41d4-a716-446655440031', // amendment.view
      '660e8400-e29b-41d4-a716-446655440032', // amendment.edit
      // Election Request
      '660e8400-e29b-41d4-a716-446655440037', // election-request.create
      '660e8400-e29b-41d4-a716-446655440038', // election-request.view
      '660e8400-e29b-41d4-a716-446655440039', // election-request.edit
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440044', // audit-request.create
      '660e8400-e29b-41d4-a716-446655440045', // audit-request.view
      '660e8400-e29b-41d4-a716-446655440046', // audit-request.edit
      // Inquiry Inspection
      '660e8400-e29b-41d4-a716-446655440051', // inquiry-inspection.create
      '660e8400-e29b-41d4-a716-446655440052', // inquiry-inspection.view
      '660e8400-e29b-41d4-a716-446655440053', // inquiry-inspection.edit
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440058', // liquidation.create
      '660e8400-e29b-41d4-a716-446655440059', // liquidation.view
      '660e8400-e29b-41d4-a716-446655440060', // liquidation.edit
      // Appeal
      '660e8400-e29b-41d4-a716-446655440065', // appeal.create
      '660e8400-e29b-41d4-a716-446655440066', // appeal.view
      '660e8400-e29b-41d4-a716-446655440067'  // appeal.edit
    ];

    const assignments = [
      { roleName: 'admin', permissions: adminPermissions },
      { roleName: 'applicant', permissions: applicantPermissions },

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