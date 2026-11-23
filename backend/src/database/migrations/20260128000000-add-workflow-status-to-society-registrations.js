'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('society_registrations', 'workflow_status', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'module_workflows',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK to module_workflows.id (current workflow step)'
    });

    await queryInterface.addIndex('society_registrations', ['workflow_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('society_registrations', ['workflow_status']);
    await queryInterface.removeColumn('society_registrations', 'workflow_status');
  }
};
