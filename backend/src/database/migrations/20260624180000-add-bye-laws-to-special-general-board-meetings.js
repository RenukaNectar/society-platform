'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [[byeLawsCol]] = await sequelize.query(
      `SHOW FULL COLUMNS FROM special_general_board_meetings LIKE 'bye_laws'`
    );

    if (!byeLawsCol) {
      await queryInterface.addColumn('special_general_board_meetings', 'bye_laws', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Bye laws document (FK to media.id)',
      });
    }

    await sequelize.query(
      `UPDATE special_general_board_meetings sgbm
       INNER JOIN society_registrations sr ON sr.id = sgbm.society_id
       SET sgbm.bye_laws = sr.bye_laws
       WHERE sgbm.bye_laws IS NULL AND sr.bye_laws IS NOT NULL`
    );

    const fallbackMediaColumns = [
      'minutes_of_meeting_id',
      'notice_id',
      'attendance_sheet_id',
    ];

    for (const column of fallbackMediaColumns) {
      await sequelize.query(
        `UPDATE special_general_board_meetings sgbm
         INNER JOIN media m ON m.id = sgbm.\`${column}\`
         SET sgbm.bye_laws = sgbm.\`${column}\`
         WHERE sgbm.bye_laws IS NULL AND sgbm.\`${column}\` IS NOT NULL`
      );
    }

    await sequelize.query(
      `UPDATE special_general_board_meetings sgbm
       LEFT JOIN media m ON m.id = sgbm.bye_laws
       SET sgbm.bye_laws = NULL
       WHERE sgbm.bye_laws IS NOT NULL AND m.id IS NULL`
    );

    await sequelize.query(
      `ALTER TABLE special_general_board_meetings MODIFY bye_laws CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    try {
      await queryInterface.addConstraint('special_general_board_meetings', {
        fields: ['bye_laws'],
        type: 'foreign key',
        name: 'fk_special_general_board_meetings_bye_laws_media',
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
        'special_general_board_meetings',
        'fk_special_general_board_meetings_bye_laws_media'
      );
    } catch (_e) {
      // Constraint may not exist; ignore.
    }

    await queryInterface.removeColumn('special_general_board_meetings', 'bye_laws');
  },
};
