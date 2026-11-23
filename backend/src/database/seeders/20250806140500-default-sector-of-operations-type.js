'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const rows = [
      {
        id: require('uuid').v4(),
        name: 'Credit',
        key: 'credit',
        description: 'Credit sector',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: 'Non-Credit',
        key: 'no_credit',
        description: 'Non-credit sector',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const existing = await queryInterface.sequelize.query(
      `SELECT name FROM sector_of_operations_type WHERE name IN (:names)`,
      { replacements: { names: rows.map(r => r.name) }, type: Sequelize.QueryTypes.SELECT }
    );
    const existingNames = new Set((existing || []).map(r => r.name));
    const toInsert = rows.filter(r => !existingNames.has(r.name));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('sector_of_operations_type', toInsert);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sector_of_operations_type', null, {});
  },
};