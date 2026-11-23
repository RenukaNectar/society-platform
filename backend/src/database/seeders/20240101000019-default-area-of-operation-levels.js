'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create area_of_operation_levels table if it doesn't exist
    await queryInterface.createTable('area_of_operation_levels', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      level_type: {
        type: Sequelize.STRING(50),
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

    await queryInterface.bulkInsert('area_of_operation_levels', [
      {
        id: require('uuid').v4(),
        name: 'Village Level',
        description: 'Operational area limited to a single village or small community',
        level_type: 'village',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Block Level',
        description: 'Operational area covering multiple villages within a block',
        level_type: 'block',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'District Level',
        description: 'Operational area covering the entire district',
        level_type: 'district',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'State Level',
        description: 'Operational area covering the entire state',
        level_type: 'state',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'National Level',
        description: 'Operational area covering multiple states or nationwide',
        level_type: 'national',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('area_of_operation_levels');
  }
}; 