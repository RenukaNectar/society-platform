'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('society_registrations', 'assigned_to_user_id', {
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

    await queryInterface.addIndex('society_registrations', ['assigned_to_user_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('society_registrations', ['assigned_to_user_id']);
    await queryInterface.removeColumn('society_registrations', 'assigned_to_user_id');
  }
};
