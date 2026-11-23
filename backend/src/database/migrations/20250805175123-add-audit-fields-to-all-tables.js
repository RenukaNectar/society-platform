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
        // Check if table exists before adding columns
        const tableExists = await queryInterface.showAllTables().then(tables => 
          tables.some(t => t.tableName === table || t === table)
        );

        if (!tableExists) {
          console.log(`Table ${table} does not exist, skipping audit fields`);
          continue;
        }

        // Check if created_by column already exists
        const columns = await queryInterface.describeTable(table);
        const hasCreatedBy = columns.created_by !== undefined;
        const hasUpdatedBy = columns.updated_by !== undefined;

        // Add created_by column if it doesn't exist
        if (!hasCreatedBy) {
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
        } else {
          console.log(`created_by column already exists in ${table}`);
        }

        // Add updated_by column if it doesn't exist
        if (!hasUpdatedBy) {
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
        } else {
          console.log(`updated_by column already exists in ${table}`);
        }

        // Add indexes for better performance (only if columns were added)
        if (!hasCreatedBy) {
          await queryInterface.addIndex(table, ['created_by']);
        }
        if (!hasUpdatedBy) {
          await queryInterface.addIndex(table, ['updated_by']);
        }

      } catch (error) {
        console.log(`Error processing table ${table}:`, error.message);
        // Continue with other tables even if one fails
        continue;
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
      try {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables().then(tables => 
          tables.some(t => t.tableName === table || t === table)
        );

        if (!tableExists) {
          console.log(`Table ${table} does not exist, skipping rollback`);
          continue;
        }

        // Check if columns exist before removing
        const columns = await queryInterface.describeTable(table);
        const hasCreatedBy = columns.created_by !== undefined;
        const hasUpdatedBy = columns.updated_by !== undefined;

        // Remove indexes first if they exist
        if (hasCreatedBy) {
          try {
            await queryInterface.removeIndex(table, ['created_by']);
          } catch (error) {
            console.log(`Index for created_by in ${table} might not exist`);
          }
        }

        if (hasUpdatedBy) {
          try {
            await queryInterface.removeIndex(table, ['updated_by']);
          } catch (error) {
            console.log(`Index for updated_by in ${table} might not exist`);
          }
        }

        // Remove columns if they exist
        if (hasCreatedBy) {
          await queryInterface.removeColumn(table, 'created_by');
          console.log(`Removed created_by column from ${table}`);
        }

        if (hasUpdatedBy) {
          await queryInterface.removeColumn(table, 'updated_by');
          console.log(`Removed updated_by column from ${table}`);
        }

      } catch (error) {
        console.log(`Error processing table ${table} in rollback:`, error.message);
        // Continue with other tables even if one fails
        continue;
      }
    }
  }
}; 