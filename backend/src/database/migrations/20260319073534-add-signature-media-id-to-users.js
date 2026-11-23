'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'signature_media_id', {
      type: Sequelize.UUID,
      allowNull: true, // ✅ nullable column
      references: {
        model: 'media',
        key: 'id',
      },
      onDelete: 'SET NULL',   // ✅ if media deleted → set null
      onUpdate: 'CASCADE',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'signature_media_id');
  },
};
