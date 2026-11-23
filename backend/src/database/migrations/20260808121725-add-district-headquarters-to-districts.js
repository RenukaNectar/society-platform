'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [columns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM districts LIKE 'district_headquarters'"
    );

    if (!columns.length) {
      await queryInterface.addColumn('districts', 'district_headquarters', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'name',
      });
    }
  },

  async down(queryInterface) {
    const [columns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM districts LIKE 'district_headquarters'"
    );

    if (columns.length) {
      await queryInterface.removeColumn('districts', 'district_headquarters');
    }
  },
};
