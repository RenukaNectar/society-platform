'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // add ARCS role
    const arcsRole = {
      id: require('uuid').v4(),
      name: 'arcs',
      description: 'ARCS',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = :name LIMIT 1`,
      { replacements: { name: arcsRole.name }, type: Sequelize.QueryTypes.SELECT }
    );
    if (!existing || existing.length === 0) {
      await queryInterface.bulkInsert('roles', [arcsRole], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', {
      name: 'arcs'
    }, {});
  }
};
