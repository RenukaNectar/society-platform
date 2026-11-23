'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE application_assignments
      MODIFY action_type ENUM(
        'initial_assign',
        'reassign',
        'workflow_assign',
        'returned_on_unavailable'
      ) NOT NULL DEFAULT 'reassign'
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE application_assignments
      MODIFY action_type ENUM(
        'initial_assign',
        'reassign',
        'workflow_assign'
      ) NOT NULL DEFAULT 'reassign'
    `);
  }
};
