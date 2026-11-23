'use strict';

/** Jt. RCS uploads liquidator-appointment observations. RCS approval stamps that file with QR and signature. */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [[column]] = await sequelize.query(
      `SHOW FULL COLUMNS FROM liquidations LIKE 'liquidator_appointment_observations'`
    );

    if (!column) {
      await queryInterface.addColumn('liquidations', 'liquidator_appointment_observations', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'RCS observations for liquidator appointment, QR-stamped on RCS approval',
      });
    }

    await sequelize.query(
      `ALTER TABLE liquidations MODIFY liquidator_appointment_observations CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    try {
      await queryInterface.addConstraint('liquidations', {
        fields: ['liquidator_appointment_observations'],
        type: 'foreign key',
        name: 'fk_liquidations_appointment_observations_media',
        references: {
          table: 'media',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    } catch (_error) {
      // Constraint may already exist.
    }

    const documents = JSON.stringify(['liquidator_appointment_observations']);
    await sequelize.query(
      `UPDATE module_workflows mw
       INNER JOIN modules m ON m.id = mw.module_id
       SET mw.approval_documents = :documents,
           mw.updated_at = NOW()
       WHERE m.\`key\` = 'LIQUIDATION'
         AND mw.sequence = 7
         AND mw.active = true`,
      { replacements: { documents } }
    );
    await sequelize.query(
      `UPDATE module_workflows mw
       INNER JOIN modules m ON m.id = mw.module_id
       SET mw.approval_documents = :documents,
           mw.updated_at = NOW()
       WHERE m.\`key\` = 'LIQUIDATION_RCS'
         AND mw.sequence = 8
         AND mw.active = true`,
      { replacements: { documents } }
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE module_workflows mw
       INNER JOIN modules m ON m.id = mw.module_id
       SET mw.approval_documents = NULL,
           mw.updated_at = NOW()
       WHERE m.\`key\` = 'LIQUIDATION'
         AND mw.sequence = 7
         AND mw.active = true
         AND mw.approval_documents LIKE '%liquidator_appointment_observations%'`
    );
    await queryInterface.sequelize.query(
      `UPDATE module_workflows mw
       INNER JOIN modules m ON m.id = mw.module_id
       SET mw.approval_documents = NULL,
           mw.updated_at = NOW()
       WHERE m.\`key\` = 'LIQUIDATION_RCS'
         AND mw.sequence = 8
         AND mw.active = true
         AND mw.approval_documents LIKE '%liquidator_appointment_observations%'`
    );

    try {
      await queryInterface.removeConstraint(
        'liquidations',
        'fk_liquidations_appointment_observations_media'
      );
    } catch (_error) {
      // Constraint may not exist.
    }

    const [[column]] = await queryInterface.sequelize.query(
      `SHOW FULL COLUMNS FROM liquidations LIKE 'liquidator_appointment_observations'`
    );
    if (column) {
      await queryInterface.removeColumn('liquidations', 'liquidator_appointment_observations');
    }
  },
};
