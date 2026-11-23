'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const agmTable = await queryInterface.describeTable('general_body_meetings');
    if (!agmTable.deleted_members) {
      await queryInterface.addColumn('general_body_meetings', 'deleted_members', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Shareholders removed via AGM/BOD with deletion reason and supporting document',
      });
    }

    const sgbmTable = await queryInterface.describeTable('special_general_board_meetings');
    if (!sgbmTable.deleted_members) {
      await queryInterface.addColumn('special_general_board_meetings', 'deleted_members', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Shareholders removed via SGBM with deletion reason and supporting document',
      });
    }
  },

  async down(queryInterface) {
    const agmTable = await queryInterface.describeTable('general_body_meetings');
    if (agmTable.deleted_members) {
      await queryInterface.removeColumn('general_body_meetings', 'deleted_members');
    }

    const sgbmTable = await queryInterface.describeTable('special_general_board_meetings');
    if (sgbmTable.deleted_members) {
      await queryInterface.removeColumn('special_general_board_meetings', 'deleted_members');
    }
  },
};
