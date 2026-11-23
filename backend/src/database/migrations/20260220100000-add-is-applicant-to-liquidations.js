'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('liquidations', 'is_applicant', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '1 = applicant workflow (society files); 0 = RCS workflow (RCS office initiates)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('liquidations', 'is_applicant');
  }
};
