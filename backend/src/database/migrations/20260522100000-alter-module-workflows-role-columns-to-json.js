'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = ['allowed_role_id', 'reject_role_id'];

    for (const columnName of columns) {
      const [constraints] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'module_workflows'
          AND COLUMN_NAME = '${columnName}'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `);

      for (const row of constraints) {
        await queryInterface.removeConstraint('module_workflows', row.CONSTRAINT_NAME);
      }

      try {
        await queryInterface.removeIndex('module_workflows', [columnName]);
      } catch (_error) {
        // Ignore when index does not exist.
      }

      await queryInterface.changeColumn('module_workflows', columnName, {
        type: Sequelize.TEXT,
        allowNull: true
      });

      await queryInterface.sequelize.query(`
        UPDATE module_workflows
        SET ${columnName} = JSON_QUOTE(${columnName})
        WHERE ${columnName} IS NOT NULL
      `);

      await queryInterface.changeColumn('module_workflows', columnName, {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment:
          columnName === 'allowed_role_id'
            ? 'Role ID or array of role IDs allowed to act at this step'
            : 'Role ID or array of role IDs for reject routing'
      });
    }

    // MySQL cannot index JSON columns directly (same as assigned_to migration).
  },

  async down(queryInterface, Sequelize) {
    for (const columnName of ['reject_role_id', 'allowed_role_id']) {
      try {
        await queryInterface.removeIndex('module_workflows', [columnName]);
      } catch (_error) {
        // Ignore.
      }

      await queryInterface.changeColumn('module_workflows', columnName, {
        type: Sequelize.TEXT,
        allowNull: true
      });

      // JSON array → first role UUID (multi-role pools from seeders)
      await queryInterface.sequelize.query(`
        UPDATE module_workflows
        SET ${columnName} = JSON_UNQUOTE(JSON_EXTRACT(${columnName}, '$[0]'))
        WHERE ${columnName} IS NOT NULL
          AND JSON_TYPE(${columnName}) = 'ARRAY'
      `);

      // JSON string → plain UUID
      await queryInterface.sequelize.query(`
        UPDATE module_workflows
        SET ${columnName} = JSON_UNQUOTE(${columnName})
        WHERE ${columnName} IS NOT NULL
          AND JSON_TYPE(${columnName}) = 'STRING'
      `);

      // Invalid values → NULL (both columns are nullable)
      await queryInterface.sequelize.query(`
        UPDATE module_workflows
        SET ${columnName} = NULL
        WHERE ${columnName} IS NOT NULL
          AND ${columnName} NOT REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      `);

      await queryInterface.changeColumn('module_workflows', columnName, {
        type: Sequelize.UUID,
        allowNull: true
      });
    }

    await queryInterface.addIndex('module_workflows', ['allowed_role_id']);
  }
};
