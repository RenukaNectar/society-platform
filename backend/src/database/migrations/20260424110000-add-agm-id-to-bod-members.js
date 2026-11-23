'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bod_members', 'agm_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'general_body_meetings',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addIndex('bod_members', ['agm_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('bod_members', ['agm_id']);
    await queryInterface.removeColumn('bod_members', 'agm_id');
  }
};
