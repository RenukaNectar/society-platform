'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('amendments', 'signatory_name', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('amendments', 'signatory_address', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('amendments', 'signatory_contact', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('amendments', 'signatory_name');
    await queryInterface.removeColumn('amendments', 'signatory_address');
    await queryInterface.removeColumn('amendments', 'signatory_contact');
  }
};
