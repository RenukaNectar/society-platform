'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // List of all tables that need audit fields
    const tables = [
      'society_registrations',
      'members',
      'roles',
      'permissions',
      'role_permissions',
      'users',
      'sessions',
      'states',
      'districts',
      'blocks',
      'water_body_types',
      'sector_of_operations',
      'registration_authorities',
      'cooperative_society_types',
      'area_of_operation_levels',
      'area_of_operation_level_urbans',
      'districts_blocks_gp_villages',
      'banks'
    ];

    for (const table of tables) {
      try {
        // Add created_by column
        await queryInterface.addColumn(table, 'created_by', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
        console.log(`Added created_by column to ${table}`);
      } catch (error) {
        console.log(`Column created_by already exists in ${table}, skipping...`);
      }

      try {
        // Add updated_by column
        await queryInterface.addColumn(table, 'updated_by', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
        console.log(`Added updated_by column to ${table}`);
      } catch (error) {
        console.log(`Column updated_by already exists in ${table}, skipping...`);
      }

      // Add indexes for better performance
      try {
        await queryInterface.addIndex(table, ['created_by']);
      } catch (error) {
        console.log(`Index on created_by already exists in ${table}, skipping...`);
      }
      
      try {
        await queryInterface.addIndex(table, ['updated_by']);
      } catch (error) {
        console.log(`Index on updated_by already exists in ${table}, skipping...`);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // List of all tables that need audit fields removed
    const tables = [
      'society_registrations',
      'members',
      'roles',
      'permissions',
      'role_permissions',
      'users',
      'sessions',
      'states',
      'districts',
      'blocks',
      'water_body_types',
      'sector_of_operations',
      'registration_authorities',
      'cooperative_society_types',
      'area_of_operation_levels',
      'area_of_operation_level_urbans',
      'districts_blocks_gp_villages',
      'banks'
    ];

    for (const table of tables) {
      // Remove indexes first
      await queryInterface.removeIndex(table, ['created_by']);
      await queryInterface.removeIndex(table, ['updated_by']);

      // Remove columns
      await queryInterface.removeColumn(table, 'created_by');
      await queryInterface.removeColumn(table, 'updated_by');
    }
  }
}; 