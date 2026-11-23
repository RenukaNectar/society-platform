'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add media_id columns for byelaw files
    await queryInterface.addColumn('amendments', 'new_proposed_byelaw_media_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Media ID for new proposed byelaw file'
    });

    await queryInterface.addColumn('amendments', 'existing_byelaw_media_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Media ID for existing byelaw file'
    });

    // Add indexes for better performance
    await queryInterface.addIndex('amendments', ['new_proposed_byelaw_media_id']);
    await queryInterface.addIndex('amendments', ['existing_byelaw_media_id']);
  },

  async down(queryInterface, Sequelize) {
    // Remove media_id columns
    await queryInterface.removeColumn('amendments', 'new_proposed_byelaw_media_id');
    await queryInterface.removeColumn('amendments', 'existing_byelaw_media_id');
  }
};
