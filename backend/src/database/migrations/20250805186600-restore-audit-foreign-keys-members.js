'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Restore foreign key constraints for audit fields
    await queryInterface.addConstraint('members', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'members_created_by_foreign_idx',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('members', {
      fields: ['updated_by'],
      type: 'foreign key',
      name: 'members_updated_by_foreign_idx',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove the foreign key constraints
    await queryInterface.removeConstraint('members', 'members_created_by_foreign_idx');
    await queryInterface.removeConstraint('members', 'members_updated_by_foreign_idx');
  }
}; 