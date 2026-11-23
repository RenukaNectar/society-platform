'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [[byeLawsCol]] = await sequelize.query(
      `SHOW FULL COLUMNS FROM liquidations LIKE 'bye_laws'`
    );

    if (!byeLawsCol) {
      await queryInterface.addColumn('liquidations', 'bye_laws', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'JT RCS rcs_observations / RCS-stamped document (FK to media.id)',
      });
    }

    await sequelize.query(
      `UPDATE liquidations l
       INNER JOIN society_registrations sr ON sr.id = l.society_id
       SET l.bye_laws = sr.bye_laws
       WHERE l.bye_laws IS NULL AND sr.bye_laws IS NOT NULL`
    );

    await sequelize.query(
      `UPDATE liquidations l
       LEFT JOIN media m ON m.id = l.bye_laws
       SET l.bye_laws = NULL
       WHERE l.bye_laws IS NOT NULL AND m.id IS NULL`
    );

    await sequelize.query(
      `ALTER TABLE liquidations MODIFY bye_laws CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    try {
      await queryInterface.addConstraint('liquidations', {
        fields: ['bye_laws'],
        type: 'foreign key',
        name: 'fk_liquidations_bye_laws_media',
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
        'liquidations',
        'fk_liquidations_bye_laws_media'
      );
    } catch (_e) {
      // Constraint may not exist; ignore.
    }

    await queryInterface.removeColumn('liquidations', 'bye_laws');
  },
};
