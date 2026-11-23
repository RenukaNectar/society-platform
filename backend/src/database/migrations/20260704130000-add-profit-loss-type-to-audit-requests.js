'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('audit_requests', 'profit_loss_type', {
      type: Sequelize.STRING(10),
      allowNull: true,
      after: 'profit_loss',
      comment: 'Type of profit_loss value: profit or loss'
    });
    await queryInterface.addColumn('audit_requests', 'gross_profit', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
      after: 'profit_loss_type',
      comment: 'Gross profit amount'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('audit_requests', 'gross_profit');
    await queryInterface.removeColumn('audit_requests', 'profit_loss_type');
  }
};
