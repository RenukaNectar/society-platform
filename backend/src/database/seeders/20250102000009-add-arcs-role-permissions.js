'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Helper function to generate role-permission mappings with shorter IDs
    const generateRolePermissions = (roleId, permissionIds) => {
      return permissionIds.map((permissionId, index) => ({
        id: `rp-${roleId.slice(-8)}-${index + 1}`,
        role_id: roleId,
        permission_id: permissionId,
        created_at: new Date()
      }));
    };

    // First, check if the arcs role exists by name or ID
    const defaultArcsRoleId = '550e8400-e29b-41d4-a716-446655440009'; // arcs role ID from default-roles.js
    
    // Check by ID first
    let existingRole = await queryInterface.rawSelect('roles', {
      where: { id: defaultArcsRoleId }
    }, ['id']);

    // If not found by ID, check by name
    if (!existingRole) {
      existingRole = await queryInterface.rawSelect('roles', {
        where: { name: 'arcs' }
      }, ['id']);
    }

    let arcsRoleId = defaultArcsRoleId;

    if (!existingRole) {
      console.log('Arcs role does not exist. Creating it first...');
      
      // Insert the arcs role
      await queryInterface.bulkInsert('roles', [{
        id: arcsRoleId,
        name: 'arcs',
        description: 'ARC',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }], {});
      
      console.log('Arcs role created successfully.');
    } else {
      console.log('Arcs role already exists.');
      // Use the existing role's ID
      arcsRoleId = existingRole;
      console.log(`Using existing arcs role ID: ${arcsRoleId}`);
    }

    // Check if arcs role permissions already exist and remove them
    const existingPermissions = await queryInterface.rawSelect('role_permissions', {
      where: { role_id: arcsRoleId }
    }, ['id']);

    if (existingPermissions) {
      console.log('Arcs role permissions already exist. Removing old permissions...');
      await queryInterface.bulkDelete('role_permissions', {
        role_id: arcsRoleId
      }, {});
      console.log('Old permissions removed.');
    }

    // Inspector permissions (same as field_inspector and senior_inspector)
    // Based on the final-role-permissions.js file, inspectors have view permissions for all features
    const inspectorPermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440017', // societies.view
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440024', // annual-return.view
      // Amendment
      '660e8400-e29b-41d4-a716-446655440031', // amendment.view
      // Election Request
      '660e8400-e29b-41d4-a716-446655440033', // election-request.view
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440039', // audit-request.view
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440059', // liquidation.view
      // Appeal
      '660e8400-e29b-41d4-a716-446655440066', // appeal.view
      // Settings
      '660e8400-e29b-41d4-a716-446655440057', // settings.view
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440060', // dashboard.view
      // Inquiry and Inspection
      '660e8400-e29b-41d4-a716-446655440052', // inquiry-inspection.view

      '660e8400-e29b-41d4-a716-446655440014', // societies.reject
      '660e8400-e29b-41d4-a716-446655440013', // societies.approved
      '660e8400-e29b-41d4-a716-446655440035', // amendment.reject
      '660e8400-e29b-41d4-a716-446655440034', // amendment.approved
      '660e8400-e29b-41d4-a716-446655440076',// dashboard.view
      
    ];

    // Generate role-permission mappings for arcs role
    const arcsRolePermissions = generateRolePermissions(arcsRoleId, inspectorPermissions);

    // Insert the arcs role permissions
    await queryInterface.bulkInsert('role_permissions', arcsRolePermissions, {});
    console.log('Arcs role permissions created successfully.');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove arcs role permissions first
    const arcsRoleId = '550e8400-e29b-41d4-a716-446655440009';
    
    // Delete role permissions
    await queryInterface.bulkDelete('role_permissions', {
      role_id: arcsRoleId
    }, {});
    
    // Delete the arcs role
    await queryInterface.bulkDelete('roles', {
      id: arcsRoleId
    }, {});
  }
};
