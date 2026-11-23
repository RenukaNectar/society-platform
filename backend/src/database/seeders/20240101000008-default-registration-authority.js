'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('registration_authorities', [
      { 
        id: require('uuid').v4(),
        name: 'State', 
        description: 'State level registration authority',
        created_at: new Date(), 
        updated_at: new Date() 
      },
      { 
        id: require('uuid').v4(),
        name: 'Central', 
        description: 'Central level registration authority',
        created_at: new Date(), 
        updated_at: new Date() 
      },
      { 
        id: require('uuid').v4(),
        name: 'District', 
        description: 'District level registration authority',
        created_at: new Date(), 
        updated_at: new Date() 
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('registration_authorities', null, {});
  }
}; 