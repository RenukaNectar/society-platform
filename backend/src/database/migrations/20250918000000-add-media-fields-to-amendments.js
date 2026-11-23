'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('amendments', 'meeting_notice_agenda_media_id', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: 'Media ID for meeting notice containing the agenda'
    });

    await queryInterface.addColumn('amendments', 'copy_of_notice_form_g_media_id', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: 'Media ID for copy of notice in form G'
    });

    await queryInterface.addColumn('amendments', 'district_drcs_arcs_recommendation_media_id', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: 'Media ID for recommendation of District DRCS/ARCS'
    });

    // Add foreign key constraints with shorter names
    await queryInterface.addConstraint('amendments', {
      fields: ['meeting_notice_agenda_media_id'],
      type: 'foreign key',
      name: 'fk_amendments_meeting_agenda_media',
      references: {
        table: 'media',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('amendments', {
      fields: ['copy_of_notice_form_g_media_id'],
      type: 'foreign key',
      name: 'fk_amendments_form_g_media',
      references: {
        table: 'media',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('amendments', {
      fields: ['district_drcs_arcs_recommendation_media_id'],
      type: 'foreign key',
      name: 'fk_amendments_drcs_media',
      references: {
        table: 'media',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraints first
    await queryInterface.removeConstraint('amendments', 'fk_amendments_drcs_media');
    await queryInterface.removeConstraint('amendments', 'fk_amendments_form_g_media');
    await queryInterface.removeConstraint('amendments', 'fk_amendments_meeting_agenda_media');
    
    // Then remove the columns
    await queryInterface.removeColumn('amendments', 'district_drcs_arcs_recommendation_media_id');
    await queryInterface.removeColumn('amendments', 'copy_of_notice_form_g_media_id');
    await queryInterface.removeColumn('amendments', 'meeting_notice_agenda_media_id');
  }
};
