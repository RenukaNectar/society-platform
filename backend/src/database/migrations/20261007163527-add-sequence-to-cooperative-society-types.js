'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cooperative_society_types', 'sequence', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Display/order sequence'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('cooperative_society_types', 'sequence');
  }
};
