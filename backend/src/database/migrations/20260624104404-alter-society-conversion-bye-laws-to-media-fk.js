'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [[byeLawsCol]] = await sequelize.query(
      `SHOW FULL COLUMNS FROM society_conversion LIKE 'bye_laws'`
    );

    if (!byeLawsCol) {
      await queryInterface.addColumn('society_conversion', 'bye_laws', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Bye laws document (FK to media.id)',
      });
    }

    const columnType = String((byeLawsCol && byeLawsCol.Type) || '').toLowerCase();
    const isAlreadyUuid = columnType === 'char(36)';

    if (!isAlreadyUuid) {
      await sequelize.query(
        `UPDATE society_conversion SET bye_laws = NULL WHERE bye_laws = ''`
      );

      await sequelize.query(
        `UPDATE society_conversion sc
         INNER JOIN society_registrations sr ON sr.id = sc.society_id
         SET sc.bye_laws = sr.bye_laws
         WHERE sc.bye_laws IS NULL AND sr.bye_laws IS NOT NULL`
      );
    }

    await sequelize.query(
      `UPDATE society_conversion sc
       LEFT JOIN media m ON m.id = sc.bye_laws
       SET sc.bye_laws = NULL
       WHERE sc.bye_laws IS NOT NULL AND m.id IS NULL`
    );

    await sequelize.query(
      `ALTER TABLE society_conversion MODIFY bye_laws CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    try {
      await queryInterface.addConstraint('society_conversion', {
        fields: ['bye_laws'],
        type: 'foreign key',
        name: 'fk_society_conversion_bye_laws_media',
        references: {
          table: 'media',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    } catch (_e) {
      // Constraint may already exist; ignore to keep migration rerunnable.
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeConstraint(
        'society_conversion',
        'fk_society_conversion_bye_laws_media'
      );
    } catch (_e) {
      // Constraint may not exist; ignore.
    }

    await queryInterface.sequelize.query(
      `ALTER TABLE society_conversion MODIFY bye_laws VARCHAR(255) NULL`
    );
  },
};
