'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [[byeLawsCol]] = await sequelize.query(
      `SHOW FULL COLUMNS FROM enquiry_requests LIKE 'bye_laws'`
    );

    if (!byeLawsCol) {
      await queryInterface.addColumn('enquiry_requests', 'bye_laws', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'JT RCS rcs_observations / RCS-stamped document (FK to media.id)',
      });
    }

    await sequelize.query(
      `UPDATE enquiry_requests er
       INNER JOIN society_registrations sr ON sr.id = er.society_id
       SET er.bye_laws = sr.bye_laws
       WHERE er.bye_laws IS NULL AND sr.bye_laws IS NOT NULL`
    );

    await sequelize.query(
      `UPDATE enquiry_requests er
       LEFT JOIN media m ON m.id = er.bye_laws
       SET er.bye_laws = NULL
       WHERE er.bye_laws IS NOT NULL AND m.id IS NULL`
    );

    await sequelize.query(
      `ALTER TABLE enquiry_requests MODIFY bye_laws CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    try {
      await queryInterface.addConstraint('enquiry_requests', {
        fields: ['bye_laws'],
        type: 'foreign key',
        name: 'fk_enquiry_requests_bye_laws_media',
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
        'enquiry_requests',
        'fk_enquiry_requests_bye_laws_media'
      );
    } catch (_e) {
      // Constraint may not exist; ignore.
    }

    await queryInterface.removeColumn('enquiry_requests', 'bye_laws');
  },
};
