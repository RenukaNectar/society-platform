'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Modify the liquidation_person field to properly allow NULL values
    await queryInterface.changeColumn('liquidations', 'liquidation_person', {
      type: Sequelize.UUID,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the change
    await queryInterface.changeColumn('liquidations', 'liquidation_person', {
      type: Sequelize.UUID,
      allowNull: true
    });
  }
};
