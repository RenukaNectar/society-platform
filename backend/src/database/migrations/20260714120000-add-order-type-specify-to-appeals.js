'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [columns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM appeals LIKE 'specify_order_type'"
    );

    if (!columns.length) {
      await queryInterface.addColumn('appeals', 'specify_order_type', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'order_type',
      });
    }
  },

  async down(queryInterface) {
    const [columns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM appeals LIKE 'specify_order_type'"
    );

    if (columns.length) {
      await queryInterface.removeColumn('appeals', 'specify_order_type');
    }
  },
};
