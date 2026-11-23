'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [[byeLawsCol]] = await sequelize.query(
      `SHOW FULL COLUMNS FROM amendments LIKE 'bye_laws'`
    );

    if (!byeLawsCol) {
      await queryInterface.addColumn('amendments', 'bye_laws', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Bye laws document (FK to media.id)',
      });
    }

    await sequelize.query(
      `UPDATE amendments a
       INNER JOIN society_registrations sr ON sr.id = a.society_id
       SET a.bye_laws = sr.bye_laws
       WHERE a.bye_laws IS NULL AND sr.bye_laws IS NOT NULL`
    );

    await sequelize.query(
      `UPDATE amendments a
       INNER JOIN media m ON m.id = a.existing_byelaw_media_id
       SET a.bye_laws = a.existing_byelaw_media_id
       WHERE a.bye_laws IS NULL AND a.existing_byelaw_media_id IS NOT NULL`
    );

    await sequelize.query(
      `UPDATE amendments a
       INNER JOIN media m ON m.id = a.new_proposed_byelaw_media_id
       SET a.bye_laws = a.new_proposed_byelaw_media_id
       WHERE a.bye_laws IS NULL AND a.new_proposed_byelaw_media_id IS NOT NULL`
    );

    await sequelize.query(
      `UPDATE amendments a
       LEFT JOIN media m ON m.id = a.bye_laws
       SET a.bye_laws = NULL
       WHERE a.bye_laws IS NOT NULL AND m.id IS NULL`
    );

    await sequelize.query(
      `ALTER TABLE amendments MODIFY bye_laws CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    try {
      await queryInterface.addConstraint('amendments', {
        fields: ['bye_laws'],
        type: 'foreign key',
        name: 'fk_amendments_bye_laws_media',
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
        'amendments',
        'fk_amendments_bye_laws_media'
      );
    } catch (_e) {
      // Constraint may not exist; ignore.
    }

    await queryInterface.removeColumn('amendments', 'bye_laws');
  },
};
