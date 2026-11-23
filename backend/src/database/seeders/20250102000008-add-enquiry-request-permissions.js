'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // Desired enquiry-request permissions
    const desiredEnquiryRequestPermissions = [
      {
        name: 'enquiry-request.create',
        description: 'Create enquiry requests',
        resource: 'enquiry-request',
        action: 'create'
      },
      {
        name: 'enquiry-request.view',
        description: 'View enquiry requests',
        resource: 'enquiry-request',
        action: 'view'
      },
      {
        name: 'enquiry-request.edit',
        description: 'Edit enquiry requests',
        resource: 'enquiry-request',
        action: 'edit'
      },
      {
        name: 'enquiry-request.delete',
        description: 'Delete enquiry requests',
        resource: 'enquiry-request',
        action: 'delete'
      },
      {
        name: 'enquiry-request.approve',
        description: 'Approve enquiry requests',
        resource: 'enquiry-request',
        action: 'approve'
      },
      {
        name: 'enquiry-request.reject',
        description: 'Reject enquiry requests',
        resource: 'enquiry-request',
        action: 'reject'
      }
    ];

    // Insert only missing permissions to keep the seeder idempotent.
    const existingPermissions = await queryInterface.sequelize.query(
      "SELECT id, name, action FROM permissions WHERE resource = 'enquiry-request'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingByName = new Map(existingPermissions.map(permission => [permission.name, permission]));
    const permissionsToInsert = desiredEnquiryRequestPermissions
      .filter(permission => !existingByName.has(permission.name))
      .map(permission => ({
        id: uuidv4(),
        ...permission,
        is_active: true,
        created_at: now,
        updated_at: now
      }));

    if (permissionsToInsert.length > 0) {
      await queryInterface.bulkInsert('permissions', permissionsToInsert, {});
    }

    const allEnquiryRequestPermissions = await queryInterface.sequelize.query(
      "SELECT id, action FROM permissions WHERE resource = 'enquiry-request'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    const permissionByAction = new Map(allEnquiryRequestPermissions.map(permission => [permission.action, permission]));

    // Get role IDs
    const roles = await queryInterface.sequelize.query(
      'SELECT id, name FROM roles WHERE is_active = true',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const rolePermissions = [];

    // Assign permissions to roles
    roles.forEach(role => {
      if (role.name === 'admin') {
        // Admin gets all permissions
        allEnquiryRequestPermissions.forEach(permission => {
          rolePermissions.push({
            id: uuidv4(),
            role_id: role.id,
            permission_id: permission.id,
            created_at: new Date()
          });
        });
      } else if (role.name === 'applicant') {
        // Applicant gets create, view, edit permissions
        ['create', 'view', 'edit'].forEach(action => {
          const permission = permissionByAction.get(action);
          if (permission) {
            rolePermissions.push({
              id: uuidv4(),
              role_id: role.id,
              permission_id: permission.id,
              created_at: new Date()
            });
          }
        });
      } else if (['registrar', 'joint_registrar', 'senior_inspector', 'deputy_registrar', 'field_inspector'].includes(role.name)) {
        // Inspector and registrar roles get all permissions
        allEnquiryRequestPermissions.forEach(permission => {
          rolePermissions.push({
            id: uuidv4(),
            role_id: role.id,
            permission_id: permission.id,
            created_at: new Date()
          });
        });
      } else if (['dealing_assistant'].includes(role.name)) {
        // Dealing assistant gets view permissions only
        const viewPermission = permissionByAction.get('view');
        if (viewPermission) {
          rolePermissions.push({
            id: uuidv4(),
            role_id: role.id,
            permission_id: viewPermission.id,
            created_at: new Date()
          });
        }
      }
    });

    // Insert role permissions
    if (rolePermissions.length > 0) {
      const existingRolePermissions = await queryInterface.sequelize.query(
        `
          SELECT role_id, permission_id
          FROM role_permissions
          WHERE permission_id IN (:permissionIds)
        `,
        {
          replacements: {
            permissionIds: allEnquiryRequestPermissions.map(permission => permission.id)
          },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      const existingRolePermissionKeys = new Set(
        existingRolePermissions.map(rolePermission => `${rolePermission.role_id}-${rolePermission.permission_id}`)
      );

      const rolePermissionsToInsert = rolePermissions.filter(rolePermission => {
        const key = `${rolePermission.role_id}-${rolePermission.permission_id}`;
        return !existingRolePermissionKeys.has(key);
      });

      if (rolePermissionsToInsert.length > 0) {
        await queryInterface.bulkInsert('role_permissions', rolePermissionsToInsert, {});
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove role permissions first by finding permission IDs
    const permissions = await queryInterface.sequelize.query(
      "SELECT id FROM permissions WHERE resource = 'enquiry-request'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (permissions.length > 0) {
      const permissionIds = permissions.map(p => p.id);
      
      // Remove role permissions
      await queryInterface.bulkDelete('role_permissions', {
        permission_id: permissionIds
      });
      
      // Remove permissions
      await queryInterface.bulkDelete('permissions', {
        id: permissionIds
      });
    }
  }
};
