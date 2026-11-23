'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [columns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM members LIKE 'shareholder_category'"
    );

    if (!columns.length) {
      await queryInterface.addColumn('members', 'shareholder_category', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'category',
        comment: "Class A - Shareholder | Class B - Nominal Shareholder",
      });
    }
  },

  async down(queryInterface) {
    const [columns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM members LIKE 'shareholder_category'"
    );

    if (columns.length) {
      await queryInterface.removeColumn('members', 'shareholder_category');
    }
  },
};
