'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop FK constraint(s) on assigned_to (if present) before type conversion.
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'module_workflows'
        AND COLUMN_NAME = 'assigned_to'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    for (const row of constraints) {
      await queryInterface.removeConstraint('module_workflows', row.CONSTRAINT_NAME);
    }

    // Ensure index is recreated cleanly after type change.
    try {
      await queryInterface.removeIndex('module_workflows', ['assigned_to']);
    } catch (_error) {
      // Ignore when index does not exist.
    }

    // Convert via TEXT first, then JSON-quote legacy UUID values.
    await queryInterface.changeColumn('module_workflows', 'assigned_to', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Existing UUID values are plain text and not valid JSON documents.
    // Wrap them as JSON strings before switching the column type to JSON.
    await queryInterface.sequelize.query(`
      UPDATE module_workflows
      SET assigned_to = JSON_QUOTE(assigned_to)
      WHERE assigned_to IS NOT NULL
    `);

    await queryInterface.changeColumn('module_workflows', 'assigned_to', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Role ID or array of role IDs eligible for assignment at this step'
    });
  },

  async down(queryInterface, Sequelize) {
    // Best effort rollback: keep only UUID-like values before reverting type.
    await queryInterface.sequelize.query(`
      UPDATE module_workflows
      SET assigned_to = NULL
      WHERE JSON_TYPE(assigned_to) <> 'STRING'
         OR JSON_UNQUOTE(assigned_to) NOT REGEXP '^[0-9a-fA-F-]{36}$'
    `);

    await queryInterface.changeColumn('module_workflows', 'assigned_to', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addIndex('module_workflows', ['assigned_to']);
  }
};
