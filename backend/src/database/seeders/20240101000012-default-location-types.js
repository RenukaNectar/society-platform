'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create a location_types table if it doesn't exist
    try {
      await queryInterface.createTable('location_types', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      });
    } catch (e) {
      // Table likely already exists (created via migrations)
    }

    const locationTypes = [
      {
        id: "1",
        name: 'Urban',
        description: 'Urban area location',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: "2",
        name: 'Rural',
        description: 'Rural area location',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const existing = await queryInterface.sequelize.query(
      `SELECT name FROM location_types WHERE name IN (:names)`,
      { replacements: { names: locationTypes.map(l => l.name) }, type: Sequelize.QueryTypes.SELECT }
    );
    const existingNames = new Set((existing || []).map(r => r.name));
    const toInsert = locationTypes.filter(l => !existingNames.has(l.name));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('location_types', toInsert, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('location_types');
  }
}; 