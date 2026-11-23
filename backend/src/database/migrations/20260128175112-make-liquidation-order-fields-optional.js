'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('liquidations', 'liquidation_order_number', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.changeColumn('liquidations', 'date_of_liquidation_order', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('liquidations', 'liquidation_order_number', {
      type: Sequelize.STRING,
      allowNull: false
    });
    
    await queryInterface.changeColumn('liquidations', 'date_of_liquidation_order', {
      type: Sequelize.DATE,
      allowNull: false
    });
  }
};
