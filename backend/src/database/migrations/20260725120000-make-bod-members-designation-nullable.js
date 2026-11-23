'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('bod_members', 'designation', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE bod_members
      SET designation = 'Member'
      WHERE designation IS NULL OR TRIM(designation) = ''
    `);

    await queryInterface.changeColumn('bod_members', 'designation', {
      type: Sequelize.STRING(100),
      allowNull: false
    });
  }
};
