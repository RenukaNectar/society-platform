'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('module_workflows', 'assigned_to', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'roles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Role ID assigned to this workflow step'
    });

    await queryInterface.addIndex('module_workflows', ['assigned_to']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('module_workflows', ['assigned_to']);
    await queryInterface.removeColumn('module_workflows', 'assigned_to');
  }
};
