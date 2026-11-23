'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adding new fields
    await queryInterface.addColumn('society_registrations', 'non_family_coop_certificate', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('society_registrations', 'site_inspection_report', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('society_registrations', 'circular_minutes_of_meeting', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('society_registrations', 'land_document', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('society_registrations', 'society_type', {
      type: Sequelize.ENUM('small_size', 'large_size'),
      comment: 'multipurpose_corporate_society',
      allowNull: true,
      defaultValue: 'small_size'
    });
    await queryInterface.addColumn('society_registrations', 'challan_receipt', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'media',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });


    await queryInterface.addColumn('society_registrations', 'challan_receipt_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('society_registrations', 'catificate_issued_by', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('society_registrations', 'non_family_coop_certificate');
    await queryInterface.removeColumn('society_registrations', 'site_inspection_report');
    await queryInterface.removeColumn('society_registrations', 'circular_minutes_of_meeting');
    await queryInterface.removeColumn('society_registrations', 'land_document');
    await queryInterface.removeColumn('society_registrations', 'society_type');
    await queryInterface.removeColumn('society_registrations', 'challan_receipt');
    await queryInterface.removeColumn('society_registrations', 'challan_receipt_at');
    await queryInterface.removeColumn('society_registrations', 'catificate_issued_by');
    // Drop enum type (important in Postgres)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_society_registrations_society_type";');
  }
};
