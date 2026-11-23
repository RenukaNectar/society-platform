'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('special_general_board_meetings', 'status', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'statuses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('special_general_board_meetings', 'workflow_status', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'module_workflows',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('special_general_board_meetings', 'assigned_to_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('special_general_board_meetings', ['status']);
    await queryInterface.addIndex('special_general_board_meetings', ['workflow_status']);
    await queryInterface.addIndex('special_general_board_meetings', ['assigned_to_user_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('special_general_board_meetings', ['assigned_to_user_id']);
    await queryInterface.removeIndex('special_general_board_meetings', ['workflow_status']);
    await queryInterface.removeIndex('special_general_board_meetings', ['status']);

    await queryInterface.removeColumn('special_general_board_meetings', 'assigned_to_user_id');
    await queryInterface.removeColumn('special_general_board_meetings', 'workflow_status');
    await queryInterface.removeColumn('special_general_board_meetings', 'status');
  }
};
