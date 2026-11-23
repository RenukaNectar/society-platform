'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const generateRolePermissions = (roleId, permissionIds) => {
      return permissionIds.map((permissionId) => ({
        id: require('crypto').randomUUID(),
        role_id: roleId,
        permission_id: permissionId,
        created_at: new Date()
      }));
    };

    // Existing roles check
    const existingJicsJacsRole = await queryInterface.rawSelect('roles', { where: { name: 'jics_jacs' } }, ['id']);
    const existingSicsSacsRole = await queryInterface.rawSelect('roles', { where: { name: 'sics_sacs' } }, ['id']);

    // Role UUIDs
    let jicsJacsRoleId = '550e8400-e29b-41d4-a716-446655440010';
    let sicsSacsRoleId = '550e8400-e29b-41d4-a716-446655440011';

    // Create missing roles
    if (!existingJicsJacsRole) {
      await queryInterface.bulkInsert('roles', [{
        id: jicsJacsRoleId,
        name: 'jics_jacs',
        description: 'JICS/JACS',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }], {});
    } else {
      jicsJacsRoleId = existingJicsJacsRole;
    }

    if (!existingSicsSacsRole) {
      await queryInterface.bulkInsert('roles', [{
        id: sicsSacsRoleId,
        name: 'sics_sacs',
        description: 'SICS/SACS',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }], {});
    } else {
      sicsSacsRoleId = existingSicsSacsRole;
    }

    // Remove existing permissions for these roles
    await queryInterface.bulkDelete('role_permissions', {
      role_id: [jicsJacsRoleId, sicsSacsRoleId]
    }, {});

    // Permissions (same as JICS/SICS)
    const rolePermissions = [
      // Societies
      '660e8400-e29b-41d4-a716-446655440017',
      '660e8400-e29b-41d4-a716-446655440020',
      '660e8400-e29b-41d4-a716-446655440021',
      // Annual Return
      '660e8400-e29b-41d4-a716-446655440024',
      '660e8400-e29b-41d4-a716-446655440027',
      '660e8400-e29b-41d4-a716-446655440028',
      // Amendment
      '660e8400-e29b-41d4-a716-446655440031',
      '660e8400-e29b-41d4-a716-446655440034',
      '660e8400-e29b-41d4-a716-446655440035',
      // Election Request
      '660e8400-e29b-41d4-a716-446655440038',
      '660e8400-e29b-41d4-a716-446655440041',
      '660e8400-e29b-41d4-a716-446655440042',
      // Audit Request
      '660e8400-e29b-41d4-a716-446655440045',
      '660e8400-e29b-41d4-a716-446655440048',
      '660e8400-e29b-41d4-a716-446655440049',
      // Inquiry Inspection
      '660e8400-e29b-41d4-a716-446655440052',
      '660e8400-e29b-41d4-a716-446655440055',
      '660e8400-e29b-41d4-a716-446655440056',
      // Liquidation
      '660e8400-e29b-41d4-a716-446655440059',
      '660e8400-e29b-41d4-a716-446655440062',
      '660e8400-e29b-41d4-a716-446655440063',
      // Appeal
      '660e8400-e29b-41d4-a716-446655440066',
      '660e8400-e29b-41d4-a716-446655440069',
      '660e8400-e29b-41d4-a716-446655440070',
      // Settings
      '660e8400-e29b-41d4-a716-446655440073',
      '660e8400-e29b-41d4-a716-446655440075',
      // Dashboard
      '660e8400-e29b-41d4-a716-446655440076'
    ];

    // Assign to both roles
    const allRolePermissions = [
      ...generateRolePermissions(jicsJacsRoleId, rolePermissions),
      ...generateRolePermissions(sicsSacsRoleId, rolePermissions)
    ];

    await queryInterface.bulkInsert('role_permissions', allRolePermissions, {});
    console.log('JICS/JACS and SICS/SACS role permissions created successfully.');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('role_permissions', {
      role_id: [
        '550e8400-e29b-41d4-a716-446655440010',
        '550e8400-e29b-41d4-a716-446655440011'
      ]
    }, {});

    await queryInterface.bulkDelete('roles', {
      name: ['jics_jacs', 'sics_sacs']
    }, {});
  }
};
