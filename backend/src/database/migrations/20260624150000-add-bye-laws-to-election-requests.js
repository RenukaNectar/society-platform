'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [[byeLawsCol]] = await sequelize.query(
      `SHOW FULL COLUMNS FROM election_requests LIKE 'bye_laws'`
    );

    if (!byeLawsCol) {
      await queryInterface.addColumn('election_requests', 'bye_laws', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Bye laws document (FK to media.id)',
      });
    }

    await sequelize.query(
      `UPDATE election_requests er
       INNER JOIN society_registrations sr ON sr.id = er.society_registration_id
       SET er.bye_laws = sr.bye_laws
       WHERE er.bye_laws IS NULL AND sr.bye_laws IS NOT NULL`
    );

    const fallbackMediaColumns = [
      'meeting_resolution_copy_media_id',
      'member_list_media_id',
      'previous_election_report_media_id',
    ];

    for (const column of fallbackMediaColumns) {
      await sequelize.query(
        `UPDATE election_requests er
         INNER JOIN media m ON m.id = er.\`${column}\`
         SET er.bye_laws = er.\`${column}\`
         WHERE er.bye_laws IS NULL AND er.\`${column}\` IS NOT NULL`
      );
    }

    await sequelize.query(
      `UPDATE election_requests er
       LEFT JOIN media m ON m.id = er.bye_laws
       SET er.bye_laws = NULL
       WHERE er.bye_laws IS NOT NULL AND m.id IS NULL`
    );

    await sequelize.query(
      `ALTER TABLE election_requests MODIFY bye_laws CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    try {
      await queryInterface.addConstraint('election_requests', {
        fields: ['bye_laws'],
        type: 'foreign key',
        name: 'fk_election_requests_bye_laws_media',
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
        'election_requests',
        'fk_election_requests_bye_laws_media'
      );
    } catch (_e) {
      // Constraint may not exist; ignore.
    }

    await queryInterface.removeColumn('election_requests', 'bye_laws');
  },
};
