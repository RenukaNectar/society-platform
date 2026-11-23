'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [[byeLawsCol]] = await sequelize.query(
      `SHOW FULL COLUMNS FROM audit_requests LIKE 'bye_laws'`
    );

    if (!byeLawsCol) {
      await queryInterface.addColumn('audit_requests', 'bye_laws', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Bye laws document (FK to media.id)',
      });
    }

    await sequelize.query(
      `UPDATE audit_requests ar
       INNER JOIN society_registrations sr ON sr.id = ar.society_registration_id
       SET ar.bye_laws = sr.bye_laws
       WHERE ar.bye_laws IS NULL AND sr.bye_laws IS NOT NULL`
    );

    const fallbackMediaColumns = [
      'registration_certificate_media_id',
      'audit_accounts_media_id',
      'audit_note_media_id',
      'agm_bod_minutes_media_id',
    ];

    for (const column of fallbackMediaColumns) {
      await sequelize.query(
        `UPDATE audit_requests ar
         INNER JOIN media m ON m.id = ar.\`${column}\`
         SET ar.bye_laws = ar.\`${column}\`
         WHERE ar.bye_laws IS NULL AND ar.\`${column}\` IS NOT NULL`
      );
    }

    await sequelize.query(
      `UPDATE audit_requests ar
       LEFT JOIN media m ON m.id = ar.bye_laws
       SET ar.bye_laws = NULL
       WHERE ar.bye_laws IS NOT NULL AND m.id IS NULL`
    );

    await sequelize.query(
      `ALTER TABLE audit_requests MODIFY bye_laws CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    try {
      await queryInterface.addConstraint('audit_requests', {
        fields: ['bye_laws'],
        type: 'foreign key',
        name: 'fk_audit_requests_bye_laws_media',
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
        'audit_requests',
        'fk_audit_requests_bye_laws_media'
      );
    } catch (_e) {
      // Constraint may not exist; ignore.
    }

    await queryInterface.removeColumn('audit_requests', 'bye_laws');
  },
};
