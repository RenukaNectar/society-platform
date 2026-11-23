'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('general_body_meetings');
    if (table.comments) {
      return;
    }
    await queryInterface.addColumn('general_body_meetings', 'comments', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('general_body_meetings');
    if (table.comments) {
      await queryInterface.removeColumn('general_body_meetings', 'comments');
    }
  }
};
