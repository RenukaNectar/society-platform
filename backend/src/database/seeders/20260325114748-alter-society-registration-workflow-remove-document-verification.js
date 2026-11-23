'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const moduleId = await queryInterface.rawSelect(
      'modules',
      { where: { key: 'SOCIETY_REGISTRATION' } },
      ['id']
    );

    if (!moduleId) return;

    const rows = await queryInterface.sequelize.query(
      `SELECT id, approval_documents
       FROM module_workflows
       WHERE module_id = :moduleId AND sequence = 2`,
      {
        replacements: { moduleId },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    for (const row of rows) {
      let docs = row.approval_documents;
      if (!docs) continue;

      if (typeof docs === 'string') {
        try {
          docs = JSON.parse(docs);
        } catch {
          continue;
        }
      }

      if (!Array.isArray(docs)) continue;

      const nextDocs = docs.filter((d) => d !== 'document_verification');
      if (nextDocs.length === docs.length) continue;

      await queryInterface.bulkUpdate(
        'module_workflows',
        { approval_documents: JSON.stringify(nextDocs), updated_at: new Date() },
        { id: row.id }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    const moduleId = await queryInterface.rawSelect(
      'modules',
      { where: { key: 'SOCIETY_REGISTRATION' } },
      ['id']
    );

    if (!moduleId) return;

    const rows = await queryInterface.sequelize.query(
      `SELECT id, approval_documents
       FROM module_workflows
       WHERE module_id = :moduleId AND sequence = 2`,
      {
        replacements: { moduleId },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    for (const row of rows) {
      let docs = row.approval_documents;
      if (!docs) continue;

      if (typeof docs === 'string') {
        try {
          docs = JSON.parse(docs);
        } catch {
          continue;
        }
      }

      if (!Array.isArray(docs)) continue;
      if (docs.includes('document_verification')) continue;

      await queryInterface.bulkUpdate(
        'module_workflows',
        { approval_documents: JSON.stringify(['document_verification', ...docs]), updated_at: new Date() },
        { id: row.id }
      );
    }
  }
};
