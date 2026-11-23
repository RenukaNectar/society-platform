'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const blocks = [
      // Blocks for Anjaw district (district_code: 1)
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 1,
        block_code: 2001,
        name: 'Hayuliang',
        block_name_hindi: 'हायुलियांग',
        name_local: 'Hayuliang',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 1,
        block_code: 2002,
        name: 'Walong',
        block_name_hindi: 'वालोंग',
        name_local: 'Walong',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 1,
        block_code: 2003,
        name: 'Hawai',
        block_name_hindi: 'हवाई',
        name_local: 'Hawai',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 1,
        block_code: 2004,
        name: 'Metengliang',
        block_name_hindi: 'मेटेंगलियांग',
        name_local: 'Metengliang',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 1,
        block_code: 2005,
        name: 'Chaglagam',
        block_name_hindi: 'चगलगाम',
        name_local: 'Chaglagam',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Blocks for Changlang district (district_code: 2)
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 2,
        block_code: 2006,
        name: 'Changlang',
        block_name_hindi: 'चांगलांग',
        name_local: 'Changlang',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 2,
        block_code: 2007,
        name: 'Miao',
        block_name_hindi: 'मियाओ',
        name_local: 'Miao',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 2,
        block_code: 2008,
        name: 'Nampong',
        block_name_hindi: 'नामपोंग',
        name_local: 'Nampong',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 2,
        block_code: 2009,
        name: 'Jairampur',
        block_name_hindi: 'जैरामपुर',
        name_local: 'Jairampur',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 2,
        block_code: 2010,
        name: 'Vijoynagar',
        block_name_hindi: 'विजयनगर',
        name_local: 'Vijoynagar',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Blocks for Papum Pare district (district_code: 17) - Capital region
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 17,
        block_code: 2011,
        name: 'Itanagar',
        block_name_hindi: 'इटानगर',
        name_local: 'Itanagar',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 17,
        block_code: 2012,
        name: 'Naharlagun',
        block_name_hindi: 'नहरलागुन',
        name_local: 'Naharlagun',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 17,
        block_code: 2013,
        name: 'Doimukh',
        block_name_hindi: 'दोइमुख',
        name_local: 'Doimukh',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 17,
        block_code: 2014,
        name: 'Sagalee',
        block_name_hindi: 'सगाले',
        name_local: 'Sagalee',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        state_code: 2,
        district_code: 17,
        block_code: 2015,
        name: 'Parang',
        block_name_hindi: 'परंग',
        name_local: 'Parang',
        block_version: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    await queryInterface.bulkInsert('blocks', blocks, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('blocks', null, {});
  }
};