'use strict';

/** Stores the JT RCS files signed on final RCS approval. other_documents are not included. */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [[column]] = await queryInterface.sequelize.query(
      `SHOW FULL COLUMNS FROM liquidations LIKE 'rcs_signed_documents'`
    );

    if (!column) {
      await queryInterface.addColumn('liquidations', 'rcs_signed_documents', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'JT RCS uploads signed on final RCS approval, excluding other_documents',
      });
    }
  },

  async down(queryInterface) {
    const [[column]] = await queryInterface.sequelize.query(
      `SHOW FULL COLUMNS FROM liquidations LIKE 'rcs_signed_documents'`
    );
    if (column) {
      await queryInterface.removeColumn('liquidations', 'rcs_signed_documents');
    }
  },
};
