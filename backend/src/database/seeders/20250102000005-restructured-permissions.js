'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, delete existing role_permissions to avoid foreign key constraints
    await queryInterface.bulkDelete('role_permissions', null, {});
    // Then delete existing permissions
    await queryInterface.bulkDelete('permissions', null, {});
    
    await queryInterface.bulkInsert('permissions', [
      // User permissions (only admin)
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        name: 'user.create',
        description: 'Create new users',
        resource: 'user',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        name: 'user.view',
        description: 'View user information',
        resource: 'user',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        name: 'user.edit',
        description: 'Edit user information',
        resource: 'user',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440004',
        name: 'user.delete',
        description: 'Delete users',
        resource: 'user',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Permissions management (only admin)
      {
        id: '660e8400-e29b-41d4-a716-446655440005',
        name: 'permission.create',
        description: 'Create new permissions',
        resource: 'permission',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440006',
        name: 'permission.view',
        description: 'View permission information',
        resource: 'permission',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440007',
        name: 'permission.edit',
        description: 'Edit permission information',
        resource: 'permission',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440008',
        name: 'permission.delete',
        description: 'Delete permissions',
        resource: 'permission',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Society permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440009',
        name: 'society.create',
        description: 'Create new society',
        resource: 'society',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440010',
        name: 'society.view',
        description: 'View society information',
        resource: 'society',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440011',
        name: 'society.edit',
        description: 'Edit society information',
        resource: 'society',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440012',
        name: 'society.delete',
        description: 'Delete society',
        resource: 'society',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440013',
        name: 'society.approve',
        description: 'Approve society registration',
        resource: 'society',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440014',
        name: 'society.reject',
        description: 'Reject society registration',
        resource: 'society',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440015',
        name: 'society.hearing',
        description: 'Apply for hearing',
        resource: 'society',
        action: 'hearing',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Societies permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440016',
        name: 'societies.create',
        description: 'Create new societies',
        resource: 'societies',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440017',
        name: 'societies.view',
        description: 'View societies information',
        resource: 'societies',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440018',
        name: 'societies.edit',
        description: 'Edit societies information',
        resource: 'societies',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440019',
        name: 'societies.delete',
        description: 'Delete societies',
        resource: 'societies',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440020',
        name: 'societies.approve',
        description: 'Approve societies',
        resource: 'societies',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440021',
        name: 'societies.reject',
        description: 'Reject societies',
        resource: 'societies',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440022',
        name: 'societies.hearing',
        description: 'Apply for hearing',
        resource: 'societies',
        action: 'hearing',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Annual Return permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440023',
        name: 'annual-return.create',
        description: 'Create new annual returns',
        resource: 'annual-return',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440024',
        name: 'annual-return.view',
        description: 'View annual return information',
        resource: 'annual-return',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440025',
        name: 'annual-return.edit',
        description: 'Edit annual return information',
        resource: 'annual-return',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440026',
        name: 'annual-return.delete',
        description: 'Delete annual returns',
        resource: 'annual-return',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440027',
        name: 'annual-return.approve',
        description: 'Approve annual returns',
        resource: 'annual-return',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440028',
        name: 'annual-return.reject',
        description: 'Reject annual returns',
        resource: 'annual-return',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440029',
        name: 'annual-return.hearing',
        description: 'Apply for hearing',
        resource: 'annual-return',
        action: 'hearing',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Amendment permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440030',
        name: 'amendment.create',
        description: 'Create new amendments',
        resource: 'amendment',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440031',
        name: 'amendment.view',
        description: 'View amendment information',
        resource: 'amendment',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440032',
        name: 'amendment.edit',
        description: 'Edit amendment information',
        resource: 'amendment',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440033',
        name: 'amendment.delete',
        description: 'Delete amendments',
        resource: 'amendment',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440034',
        name: 'amendment.approve',
        description: 'Approve amendments',
        resource: 'amendment',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440035',
        name: 'amendment.reject',
        description: 'Reject amendments',
        resource: 'amendment',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440036',
        name: 'amendment.hearing',
        description: 'Apply for hearing',
        resource: 'amendment',
        action: 'hearing',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Election Request permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440037',
        name: 'election-request.create',
        description: 'Create new election requests',
        resource: 'election-request',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440038',
        name: 'election-request.view',
        description: 'View election request information',
        resource: 'election-request',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440039',
        name: 'election-request.edit',
        description: 'Edit election request information',
        resource: 'election-request',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440040',
        name: 'election-request.delete',
        description: 'Delete election requests',
        resource: 'election-request',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440041',
        name: 'election-request.approve',
        description: 'Approve election requests',
        resource: 'election-request',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440042',
        name: 'election-request.reject',
        description: 'Reject election requests',
        resource: 'election-request',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440043',
        name: 'election-request.hearing',
        description: 'Apply for hearing',
        resource: 'election-request',
        action: 'hearing',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Audit Request permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440044',
        name: 'audit-request.create',
        description: 'Create new audit requests',
        resource: 'audit-request',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440045',
        name: 'audit-request.view',
        description: 'View audit request information',
        resource: 'audit-request',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440046',
        name: 'audit-request.edit',
        description: 'Edit audit request information',
        resource: 'audit-request',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440047',
        name: 'audit-request.delete',
        description: 'Delete audit requests',
        resource: 'audit-request',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440048',
        name: 'audit-request.approve',
        description: 'Approve audit requests',
        resource: 'audit-request',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440049',
        name: 'audit-request.reject',
        description: 'Reject audit requests',
        resource: 'audit-request',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440050',
        name: 'audit-request.hearing',
        description: 'Apply for hearing',
        resource: 'audit-request',
        action: 'hearing',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Inquiry Inspection permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440051',
        name: 'inquiry-inspection.create',
        description: 'Create new inquiry and inspection requests',
        resource: 'inquiry-inspection',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440052',
        name: 'inquiry-inspection.view',
        description: 'View inquiry and inspection information',
        resource: 'inquiry-inspection',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440053',
        name: 'inquiry-inspection.edit',
        description: 'Edit inquiry and inspection information',
        resource: 'inquiry-inspection',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440054',
        name: 'inquiry-inspection.delete',
        description: 'Delete inquiry and inspection requests',
        resource: 'inquiry-inspection',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440055',
        name: 'inquiry-inspection.approve',
        description: 'Approve inquiry and inspection requests',
        resource: 'inquiry-inspection',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440056',
        name: 'inquiry-inspection.reject',
        description: 'Reject inquiry and inspection requests',
        resource: 'inquiry-inspection',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440057',
        name: 'inquiry-inspection.hearing',
        description: 'Apply for hearing',
        resource: 'inquiry-inspection',
        action: 'hearing',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Liquidation permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440058',
        name: 'liquidation.create',
        description: 'Create new liquidations',
        resource: 'liquidation',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440059',
        name: 'liquidation.view',
        description: 'View liquidation information',
        resource: 'liquidation',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440060',
        name: 'liquidation.edit',
        description: 'Edit liquidation information',
        resource: 'liquidation',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440061',
        name: 'liquidation.delete',
        description: 'Delete liquidations',
        resource: 'liquidation',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440062',
        name: 'liquidation.approve',
        description: 'Approve liquidations',
        resource: 'liquidation',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440063',
        name: 'liquidation.reject',
        description: 'Reject liquidations',
        resource: 'liquidation',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440064',
        name: 'liquidation.hearing',
        description: 'Apply for hearing',
        resource: 'liquidation',
        action: 'hearing',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Appeal permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440065',
        name: 'appeal.create',
        description: 'Create new appeals',
        resource: 'appeal',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440066',
        name: 'appeal.view',
        description: 'View appeal information',
        resource: 'appeal',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440067',
        name: 'appeal.edit',
        description: 'Edit appeal information',
        resource: 'appeal',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440068',
        name: 'appeal.delete',
        description: 'Delete appeals',
        resource: 'appeal',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440069',
        name: 'appeal.approve',
        description: 'Approve appeals',
        resource: 'appeal',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440070',
        name: 'appeal.reject',
        description: 'Reject appeals',
        resource: 'appeal',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440071',
        name: 'appeal.hearing',
        description: 'Apply for hearing',
        resource: 'appeal',
        action: 'hearing',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Settings permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440072',
        name: 'settings.create',
        description: 'Create new settings',
        resource: 'settings',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440073',
        name: 'settings.view',
        description: 'View settings information',
        resource: 'settings',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440074',
        name: 'settings.edit',
        description: 'Edit settings information',
        resource: 'settings',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440075',
        name: 'settings.delete',
        description: 'Delete settings',
        resource: 'settings',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Dashboard permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440076',
        name: 'dashboard.view',
        description: 'View dashboard',
        resource: 'dashboard',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('permissions', null, {});
  }
}; 