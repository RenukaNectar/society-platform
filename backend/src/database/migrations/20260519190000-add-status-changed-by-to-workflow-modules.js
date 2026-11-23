'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = [
      'appeals',
      'election_requests',
      'audit_requests',
      'society_renewals',
      'society_conversion',
      'liquidations',
      'general_body_meetings',
      'special_general_board_meetings'
    ];

    for (const tableName of tables) {
      const desc = await queryInterface.describeTable(tableName);

      if (!desc.status_changed_at) {
        await queryInterface.addColumn(tableName, 'status_changed_at', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp when workflow assignment was last changed by an officer'
        });
      }

      if (!desc.status_changed_by) {
        await queryInterface.addColumn(tableName, 'status_changed_by', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'Officer who last forwarded/assigned this application (original assigner for reassign)'
        });

        await queryInterface.addIndex(tableName, ['status_changed_by']);
      }
    }
  },

  async down(queryInterface) {
    const tables = [
      'appeals',
      'election_requests',
      'audit_requests',
      'society_renewals',
      'society_conversion',
      'liquidations',
      'general_body_meetings',
      'special_general_board_meetings'
    ];

    for (const tableName of tables) {
      const desc = await queryInterface.describeTable(tableName);

      if (desc.status_changed_by) {
        try {
          await queryInterface.removeIndex(tableName, ['status_changed_by']);
        } catch {
          // index may not exist
        }
        await queryInterface.removeColumn(tableName, 'status_changed_by');
      }

      if (desc.status_changed_at) {
        await queryInterface.removeColumn(tableName, 'status_changed_at');
      }
    }
  }
};
