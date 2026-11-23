'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('society_conversion', 'workflow_status', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'module_workflows',
        key: 'id'
      }
    });
    await queryInterface.addColumn('society_conversion', 'assigned_to_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User ID to whom this registration is assigned (set when workflow is approved with assigned_to)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('society_conversion', 'workflow_status');
    await queryInterface.removeColumn('society_conversion', 'assigned_to_user_id');
  }
};
