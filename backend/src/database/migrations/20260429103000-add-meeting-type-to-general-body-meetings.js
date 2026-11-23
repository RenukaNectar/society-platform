'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('general_body_meetings');
    const hasMeetingTypeColumn = !!tableDefinition.meeting_type;

    if (!hasMeetingTypeColumn) {
      await queryInterface.addColumn('general_body_meetings', 'meeting_type', {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Meeting module type (AGM or BOD)'
      });
    }

    // Backfill from active workflow module where present.
    await queryInterface.sequelize.query(`
      UPDATE general_body_meetings gbm
      JOIN module_workflows mw ON gbm.workflow_status = mw.id
      JOIN modules m ON m.id = mw.module_id
      SET gbm.meeting_type = m.key
      WHERE m.key IN ('AGM', 'BOD')
        AND gbm.meeting_type IS NULL
    `);

    // Backfill from history for rows where workflow_status is already cleared.
    await queryInterface.sequelize.query(`
      UPDATE general_body_meetings gbm
      JOIN (
        SELECT reference_id, resource
        FROM (
          SELECT
            reference_id,
            resource,
            ROW_NUMBER() OVER (PARTITION BY reference_id ORDER BY created_at DESC, id DESC) AS rn
          FROM history
          WHERE resource IN ('AGM', 'BOD')
        ) ranked
        WHERE rn = 1
      ) h ON gbm.id = h.reference_id
      SET gbm.meeting_type = h.resource
      WHERE gbm.meeting_type IS NULL
    `);

    const indexes = await queryInterface.showIndex('general_body_meetings');
    const hasMeetingTypeIndex = indexes.some((idx) =>
      idx.fields?.some((field) => field.attribute === 'meeting_type')
    );
    if (!hasMeetingTypeIndex) {
      await queryInterface.addIndex('general_body_meetings', ['meeting_type']);
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('general_body_meetings');
    const hasMeetingTypeIndex = indexes.some((idx) =>
      idx.fields?.some((field) => field.attribute === 'meeting_type')
    );
    if (hasMeetingTypeIndex) {
      await queryInterface.removeIndex('general_body_meetings', ['meeting_type']);
    }

    const tableDefinition = await queryInterface.describeTable('general_body_meetings');
    const hasMeetingTypeColumn = !!tableDefinition.meeting_type;
    if (hasMeetingTypeColumn) {
      await queryInterface.removeColumn('general_body_meetings', 'meeting_type');
    }
  }
};
