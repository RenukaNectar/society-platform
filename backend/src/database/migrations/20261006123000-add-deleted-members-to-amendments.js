'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('amendments');

    if (!table.deleted_members) {
      await queryInterface.addColumn('amendments', 'deleted_members', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Shareholders removed via amendment: member snapshot, deletion reason, supporting document media id',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('amendments');

    if (table.deleted_members) {
      await queryInterface.removeColumn('amendments', 'deleted_members');
    }
  },
};
