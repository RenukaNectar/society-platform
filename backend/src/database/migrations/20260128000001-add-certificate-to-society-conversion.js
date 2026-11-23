'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('society_conversion', 'certificate', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Certificate media reference for the society conversion'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('society_conversion', 'certificate');
  }
};
