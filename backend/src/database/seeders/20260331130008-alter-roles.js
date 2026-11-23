'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    //   remove jt_rcs_hq role
    await queryInterface.bulkDelete('roles', { name: 'jt_rcs_hq' }, {});
  },

  async down(queryInterface, Sequelize) {
    // add jt_rcs_hq role
    await queryInterface.bulkInsert('roles', [{
      id: require('uuid').v4(),
      name: 'jt_rcs_hq',
      description: 'JT RCS HQ',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  }
};
