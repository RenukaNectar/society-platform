'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'special_general_board_meetings';
    const tableDefinition = await queryInterface.describeTable(tableName);

    if (!tableDefinition.status) {
      await queryInterface.addColumn(tableName, 'status', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'statuses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!tableDefinition.workflow_status) {
      await queryInterface.addColumn(tableName, 'workflow_status', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'module_workflows',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!tableDefinition.assigned_to_user_id) {
      await queryInterface.addColumn(tableName, 'assigned_to_user_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    const indexes = await queryInterface.showIndex(tableName);
    const indexNames = new Set(indexes.map(index => index.name));

    if (!indexNames.has('special_general_board_meetings_status')) {
      await queryInterface.addIndex(tableName, ['status'], {
        name: 'special_general_board_meetings_status'
      });
    }

    if (!indexNames.has('special_general_board_meetings_workflow_status')) {
      await queryInterface.addIndex(tableName, ['workflow_status'], {
        name: 'special_general_board_meetings_workflow_status'
      });
    }

    if (!indexNames.has('special_general_board_meetings_assigned_to_user_id')) {
      await queryInterface.addIndex(tableName, ['assigned_to_user_id'], {
        name: 'special_general_board_meetings_assigned_to_user_id'
      });
    }
  },

  async down(queryInterface) {
    const tableName = 'special_general_board_meetings';
    const tableDefinition = await queryInterface.describeTable(tableName);
    const indexes = await queryInterface.showIndex(tableName);
    const indexNames = new Set(indexes.map(index => index.name));

    if (indexNames.has('special_general_board_meetings_assigned_to_user_id')) {
      await queryInterface.removeIndex(tableName, 'special_general_board_meetings_assigned_to_user_id');
    }
    if (indexNames.has('special_general_board_meetings_workflow_status')) {
      await queryInterface.removeIndex(tableName, 'special_general_board_meetings_workflow_status');
    }
    if (indexNames.has('special_general_board_meetings_status')) {
      await queryInterface.removeIndex(tableName, 'special_general_board_meetings_status');
    }

    if (tableDefinition.assigned_to_user_id) {
      await queryInterface.removeColumn(tableName, 'assigned_to_user_id');
    }
    if (tableDefinition.workflow_status) {
      await queryInterface.removeColumn(tableName, 'workflow_status');
    }
    if (tableDefinition.status) {
      await queryInterface.removeColumn(tableName, 'status');
    }
  }
};
