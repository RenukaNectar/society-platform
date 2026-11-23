'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('cooperative_society_types', [
      { 
        id: require('uuid').v4(),
        name: 'Primary Cooperative', 
        description: 'Primary level cooperative societies',
        created_at: new Date(), 
        updated_at: new Date() 
      },
      { 
        id: require('uuid').v4(),
        name: 'District Cooperative', 
        description: 'District level cooperative societies',
        created_at: new Date(), 
        updated_at: new Date() 
      },
      { 
        id: require('uuid').v4(),
        name: 'State Cooperative', 
        description: 'State level cooperative societies',
        created_at: new Date(), 
        updated_at: new Date() 
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('cooperative_society_types', null, {});
  }
}; 