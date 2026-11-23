'use strict';

const { v4: uuidv4 } = require('uuid');

/** Core workflow status keys used across modules (registration, amendment, conversion, etc.). */
const CORE_WORKFLOW_STATUSES = [
  {
    key: 'submitted',
    title: 'Submitted',
    description: 'Application has been submitted',
  },
  {
    key: 'approved',
    title: 'Approved',
    description: 'Application approved',
  },
  {
    key: 'rejected',
    title: 'Rejected',
    description: 'Application rejected',
  },
  {
    key: 'resubmitted',
    title: 'Resubmitted',
    description: 'Application resubmitted',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const keys = CORE_WORKFLOW_STATUSES.map((s) => s.key);
    const existing = await queryInterface.sequelize.query(
      'SELECT `key` FROM statuses WHERE `key` IN (:keys)',
      { replacements: { keys }, type: Sequelize.QueryTypes.SELECT }
    );

    const existingKeys = new Set((existing || []).map((row) => row.key));
    const now = new Date();
    const toInsert = CORE_WORKFLOW_STATUSES.filter((s) => !existingKeys.has(s.key)).map(
      (s) => ({
        id: uuidv4(),
        key: s.key,
        title: s.title,
        description: s.description,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
    );

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('statuses', toInsert, {});
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'statuses',
      { key: CORE_WORKFLOW_STATUSES.map((s) => s.key) },
      {}
    );
  },
};
