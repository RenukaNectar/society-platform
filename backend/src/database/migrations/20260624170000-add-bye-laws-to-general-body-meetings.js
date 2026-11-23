'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [[byeLawsCol]] = await sequelize.query(
      `SHOW FULL COLUMNS FROM general_body_meetings LIKE 'bye_laws'`
    );

    if (!byeLawsCol) {
      await queryInterface.addColumn('general_body_meetings', 'bye_laws', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Bye laws document (FK to media.id)',
      });
    }

    await sequelize.query(
      `UPDATE general_body_meetings gbm
       INNER JOIN society_registrations sr ON sr.id = gbm.society_id
       SET gbm.bye_laws = sr.bye_laws
       WHERE gbm.bye_laws IS NULL AND sr.bye_laws IS NOT NULL`
    );

    const fallbackMediaColumns = [
      'minutes_of_meeting_id',
      'notice_id',
      'attendance_sheet_id',
      'media_id',
      'issued_proceedings_document_id',
    ];

    for (const column of fallbackMediaColumns) {
      await sequelize.query(
        `UPDATE general_body_meetings gbm
         INNER JOIN media m ON m.id = gbm.\`${column}\`
         SET gbm.bye_laws = gbm.\`${column}\`
         WHERE gbm.bye_laws IS NULL AND gbm.\`${column}\` IS NOT NULL`
      );
    }

    await sequelize.query(
      `UPDATE general_body_meetings gbm
       LEFT JOIN media m ON m.id = gbm.bye_laws
       SET gbm.bye_laws = NULL
       WHERE gbm.bye_laws IS NOT NULL AND m.id IS NULL`
    );

    await sequelize.query(
      `ALTER TABLE general_body_meetings MODIFY bye_laws CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    try {
      await queryInterface.addConstraint('general_body_meetings', {
        fields: ['bye_laws'],
        type: 'foreign key',
        name: 'fk_general_body_meetings_bye_laws_media',
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
        'general_body_meetings',
        'fk_general_body_meetings_bye_laws_media'
      );
    } catch (_e) {
      // Constraint may not exist; ignore.
    }

    await queryInterface.removeColumn('general_body_meetings', 'bye_laws');
  },
};
