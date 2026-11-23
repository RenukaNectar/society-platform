'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const permissions = [
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

      // Registration permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440005',
        name: 'registration.create',
        description: 'Create new registrations',
        resource: 'registration',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440006',
        name: 'registration.view',
        description: 'View registration information',
        resource: 'registration',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440007',
        name: 'registration.edit',
        description: 'Edit registration information',
        resource: 'registration',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440008',
        name: 'registration.delete',
        description: 'Delete registrations',
        resource: 'registration',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440009',
        name: 'registration.approve',
        description: 'Approve registrations',
        resource: 'registration',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440010',
        name: 'registration.reject',
        description: 'Reject registrations',
        resource: 'registration',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Annual Return permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440011',
        name: 'annual-return.create',
        description: 'Create new annual returns',
        resource: 'annual-return',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440012',
        name: 'annual-return.view',
        description: 'View annual return information',
        resource: 'annual-return',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440013',
        name: 'annual-return.edit',
        description: 'Edit annual return information',
        resource: 'annual-return',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440014',
        name: 'annual-return.delete',
        description: 'Delete annual returns',
        resource: 'annual-return',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440015',
        name: 'annual-return.approve',
        description: 'Approve annual returns',
        resource: 'annual-return',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440016',
        name: 'annual-return.reject',
        description: 'Reject annual returns',
        resource: 'annual-return',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Amendment permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440017',
        name: 'amendment.create',
        description: 'Create new amendments',
        resource: 'amendment',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440018',
        name: 'amendment.view',
        description: 'View amendment information',
        resource: 'amendment',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440019',
        name: 'amendment.edit',
        description: 'Edit amendment information',
        resource: 'amendment',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440020',
        name: 'amendment.delete',
        description: 'Delete amendments',
        resource: 'amendment',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440021',
        name: 'amendment.approve',
        description: 'Approve amendments',
        resource: 'amendment',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440022',
        name: 'amendment.reject',
        description: 'Reject amendments',
        resource: 'amendment',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Audit Request permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440023',
        name: 'audit-request.create',
        description: 'Create new audit requests',
        resource: 'audit-request',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440024',
        name: 'audit-request.view',
        description: 'View audit request information',
        resource: 'audit-request',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440025',
        name: 'audit-request.edit',
        description: 'Edit audit request information',
        resource: 'audit-request',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440026',
        name: 'audit-request.delete',
        description: 'Delete audit requests',
        resource: 'audit-request',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440027',
        name: 'audit-request.approve',
        description: 'Approve audit requests',
        resource: 'audit-request',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440028',
        name: 'audit-request.reject',
        description: 'Reject audit requests',
        resource: 'audit-request',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Election Request permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440029',
        name: 'election-request.create',
        description: 'Create new election requests',
        resource: 'election-request',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440030',
        name: 'election-request.view',
        description: 'View election request information',
        resource: 'election-request',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440031',
        name: 'election-request.edit',
        description: 'Edit election request information',
        resource: 'election-request',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440032',
        name: 'election-request.delete',
        description: 'Delete election requests',
        resource: 'election-request',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440033',
        name: 'election-request.approve',
        description: 'Approve election requests',
        resource: 'election-request',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440034',
        name: 'election-request.reject',
        description: 'Reject election requests',
        resource: 'election-request',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Liquidation permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440035',
        name: 'liquidation.create',
        description: 'Create new liquidations',
        resource: 'liquidation',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440036',
        name: 'liquidation.view',
        description: 'View liquidation information',
        resource: 'liquidation',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440037',
        name: 'liquidation.edit',
        description: 'Edit liquidation information',
        resource: 'liquidation',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440038',
        name: 'liquidation.delete',
        description: 'Delete liquidations',
        resource: 'liquidation',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440039',
        name: 'liquidation.approve',
        description: 'Approve liquidations',
        resource: 'liquidation',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440040',
        name: 'liquidation.reject',
        description: 'Reject liquidations',
        resource: 'liquidation',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Inquiry permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440041',
        name: 'inquiry.create',
        description: 'Create new inquiries',
        resource: 'inquiry',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440042',
        name: 'inquiry.view',
        description: 'View inquiry information',
        resource: 'inquiry',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440043',
        name: 'inquiry.edit',
        description: 'Edit inquiry information',
        resource: 'inquiry',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440044',
        name: 'inquiry.delete',
        description: 'Delete inquiries',
        resource: 'inquiry',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440045',
        name: 'inquiry.approve',
        description: 'Approve inquiries',
        resource: 'inquiry',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440046',
        name: 'inquiry.reject',
        description: 'Reject inquiries',
        resource: 'inquiry',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Appeal permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440047',
        name: 'appeal.create',
        description: 'Create new appeals',
        resource: 'appeal',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440048',
        name: 'appeal.view',
        description: 'View appeal information',
        resource: 'appeal',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440049',
        name: 'appeal.edit',
        description: 'Edit appeal information',
        resource: 'appeal',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440050',
        name: 'appeal.delete',
        description: 'Delete appeals',
        resource: 'appeal',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440051',
        name: 'appeal.approve',
        description: 'Approve appeals',
        resource: 'appeal',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440052',
        name: 'appeal.reject',
        description: 'Reject appeals',
        resource: 'appeal',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Society permissions
      {
        id: '660e8400-e29b-41d4-a716-446655440053',
        name: 'society.create',
        description: 'Create new society',
        resource: 'society',
        action: 'create',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440054',
        name: 'society.view',
        description: 'View society information',
        resource: 'society',
        action: 'view',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440055',
        name: 'society.edit',
        description: 'Edit society information',
        resource: 'society',
        action: 'edit',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440056',
        name: 'society.delete',
        description: 'Delete society',
        resource: 'society',
        action: 'delete',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440057',
        name: 'society.approve',
        description: 'Approve society registration',
        resource: 'society',
        action: 'approve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440058',
        name: 'society.reject',
        description: 'Reject society registration',
        resource: 'society',
        action: 'reject',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Special permissions for registrar
      {
        id: '660e8400-e29b-41d4-a716-446655440059',
        name: 'hearing.apply',
        description: 'Apply for hearing',
        resource: 'hearing',
        action: 'apply',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440060',
        name: 'hearing.resolve',
        description: 'Resolve hearing',
        resource: 'hearing',
        action: 'resolve',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const permissionIds = permissions.map(p => p.id);
    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM permissions WHERE id IN (:ids)`,
      { replacements: { ids: permissionIds }, type: Sequelize.QueryTypes.SELECT }
    );
    const existingIds = new Set((existing || []).map(r => r.id));
    const toInsert = permissions.filter(p => !existingIds.has(p.id));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('permissions', toInsert, {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('permissions', null, {});
  }
}; 