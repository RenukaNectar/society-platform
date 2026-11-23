'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('general_body_meetings', 'status', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'statuses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK to statuses.id (current status of the AGM)'
    });

    await queryInterface.addIndex('general_body_meetings', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('general_body_meetings', ['status']);
    await queryInterface.removeColumn('general_body_meetings', 'status');
  }
};
