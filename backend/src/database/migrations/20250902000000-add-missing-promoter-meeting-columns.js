'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add missing columns that are defined in the model but not in the database
    await queryInterface.addColumn('society_registrations', 'minutes_of_meeting_of_promoters_meeting', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addColumn('society_registrations', 'circular_for_promoters_meeting', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addColumn('society_registrations', 'full_particulars_of_the_promoter', {
      type: Sequelize.UUID,
      allowNull: true
    });

    // Add foreign key constraints with shorter names
    await queryInterface.addConstraint('society_registrations', {
      fields: ['minutes_of_meeting_of_promoters_meeting'],
      type: 'foreign key',
      name: 'fk_sr_minutes_promoters_meeting',
      references: {
        table: 'media',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('society_registrations', {
      fields: ['circular_for_promoters_meeting'],
      type: 'foreign key',
      name: 'fk_sr_circular_promoters_meeting',
      references: {
        table: 'media',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('society_registrations', {
      fields: ['full_particulars_of_the_promoter'],
      type: 'foreign key',
      name: 'fk_sr_full_particulars_promoter',
      references: {
        table: 'media',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('society_registrations', 'minutes_of_meeting_of_promoters_meeting');
    await queryInterface.removeColumn('society_registrations', 'circular_for_promoters_meeting');
    await queryInterface.removeColumn('society_registrations', 'full_particulars_of_the_promoter');
  }
};
