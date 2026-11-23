'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('water_body_types', [
      {
        id: require('uuid').v4(),
        name: 'River',
        water_body_types_hindi: 'नदी',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Lake',
        water_body_types_hindi: 'झील',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Pond',
        water_body_types_hindi: 'तालाब',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Canal',
        water_body_types_hindi: 'नहर',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Reservoir',
        water_body_types_hindi: 'जलाशय',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Stream',
        water_body_types_hindi: 'धारा',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Well',
        water_body_types_hindi: 'कुआं',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Spring',
        water_body_types_hindi: 'झरना',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('water_body_types', null, {});
  }
}; 