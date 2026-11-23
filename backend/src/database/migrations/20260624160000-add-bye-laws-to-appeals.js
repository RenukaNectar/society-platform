'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [[byeLawsCol]] = await sequelize.query(
      `SHOW FULL COLUMNS FROM appeals LIKE 'bye_laws'`
    );

    if (!byeLawsCol) {
      await queryInterface.addColumn('appeals', 'bye_laws', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Bye laws document (FK to media.id)',
      });
    }

    await sequelize.query(
      `UPDATE appeals a
       INNER JOIN society_registrations sr ON sr.registration_number = a.society_registration_no
       SET a.bye_laws = sr.bye_laws
       WHERE a.bye_laws IS NULL AND sr.bye_laws IS NOT NULL`
    );

    await sequelize.query(
      `UPDATE appeals a
       INNER JOIN media m ON m.id = a.supporting_documents
       SET a.bye_laws = a.supporting_documents
       WHERE a.bye_laws IS NULL AND a.supporting_documents IS NOT NULL`
    );

    await sequelize.query(
      `UPDATE appeals a
       LEFT JOIN media m ON m.id = a.bye_laws
       SET a.bye_laws = NULL
       WHERE a.bye_laws IS NOT NULL AND m.id IS NULL`
    );

    await sequelize.query(
      `ALTER TABLE appeals MODIFY bye_laws CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    try {
      await queryInterface.addConstraint('appeals', {
        fields: ['bye_laws'],
        type: 'foreign key',
        name: 'fk_appeals_bye_laws_media',
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
        'appeals',
        'fk_appeals_bye_laws_media'
      );
    } catch (_e) {
      // Constraint may not exist; ignore.
    }

    await queryInterface.removeColumn('appeals', 'bye_laws');
  },
};
