'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('enquiry_requests', 'workflow_status', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'module_workflows', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Current module_workflows step id'
    });

    await queryInterface.addColumn('enquiry_requests', 'assigned_to_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User assigned at the current workflow step'
    });

    await queryInterface.addColumn('enquiry_requests', 'is_rcs_initiated', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'false = district flow (INSPECTION_INQUIRY); true = RCS/HQ flow (INSPECTION_INQUIRY_RCS)'
    });

    await queryInterface.addIndex('enquiry_requests', ['workflow_status']);
    await queryInterface.addIndex('enquiry_requests', ['assigned_to_user_id']);
    await queryInterface.addIndex('enquiry_requests', ['is_rcs_initiated']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('enquiry_requests', ['is_rcs_initiated']);
    await queryInterface.removeIndex('enquiry_requests', ['assigned_to_user_id']);
    await queryInterface.removeIndex('enquiry_requests', ['workflow_status']);
    await queryInterface.removeColumn('enquiry_requests', 'is_rcs_initiated');
    await queryInterface.removeColumn('enquiry_requests', 'assigned_to_user_id');
    await queryInterface.removeColumn('enquiry_requests', 'workflow_status');
  }
};
