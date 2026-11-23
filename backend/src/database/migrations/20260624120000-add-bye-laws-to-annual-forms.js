'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [[byeLawsCol]] = await sequelize.query(
      `SHOW FULL COLUMNS FROM annual_forms LIKE 'bye_laws'`
    );

    if (!byeLawsCol) {
      await queryInterface.addColumn('annual_forms', 'bye_laws', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Bye laws document (FK to media.id)',
      });
    }

    await sequelize.query(
      `UPDATE annual_forms af
       INNER JOIN society_registrations sr ON sr.id = af.society_id
       SET af.bye_laws = sr.bye_laws
       WHERE af.bye_laws IS NULL AND sr.bye_laws IS NOT NULL`
    );

    await sequelize.query(
      `UPDATE annual_forms af
       INNER JOIN society_registrations sr ON sr.society_id = af.society_id
       SET af.bye_laws = sr.bye_laws
       WHERE af.bye_laws IS NULL AND sr.bye_laws IS NOT NULL`
    );

    await sequelize.query(
      `UPDATE annual_forms af
       LEFT JOIN media m ON m.id = af.bye_laws
       SET af.bye_laws = NULL
       WHERE af.bye_laws IS NOT NULL AND m.id IS NULL`
    );

    await sequelize.query(
      `ALTER TABLE annual_forms MODIFY bye_laws CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    try {
      await queryInterface.addConstraint('annual_forms', {
        fields: ['bye_laws'],
        type: 'foreign key',
        name: 'fk_annual_forms_bye_laws_media',
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
        'annual_forms',
        'fk_annual_forms_bye_laws_media'
      );
    } catch (_e) {
      // Constraint may not exist; ignore.
    }

    await queryInterface.removeColumn('annual_forms', 'bye_laws');
  },
};
