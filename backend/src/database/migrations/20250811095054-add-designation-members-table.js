'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('members', 'designation', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'The designation of the member within the organization'
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('members', 'designation');
  }
};
