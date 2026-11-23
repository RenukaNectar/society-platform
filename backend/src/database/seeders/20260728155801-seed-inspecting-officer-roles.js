'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = [
      {
        id: uuidv4(),
        name: 'inspecting_officer_district',
        description: 'Inspecting Officer (District)',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'inspecting_officer_hq',
        description: 'Inspecting Officer (HO)',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const roleNames = roles.map((r) => r.name);
    const existing = await queryInterface.sequelize.query(
      'SELECT name FROM roles WHERE name IN (:names)',
      { replacements: { names: roleNames }, type: Sequelize.QueryTypes.SELECT }
    );
    const existingNames = new Set((existing || []).map((r) => r.name));

    const toInsert = roles.filter((r) => !existingNames.has(r.name));
    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('roles', toInsert, {});
      console.log(`Inserted inspecting officer roles: ${toInsert.map((r) => r.name).join(', ')}`);
    } else {
      console.log('Inspecting officer roles already exist; skipping insert.');
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'roles',
      { name: ['inspecting_officer_district', 'inspecting_officer_hq'] },
      {}
    );
  }
};
