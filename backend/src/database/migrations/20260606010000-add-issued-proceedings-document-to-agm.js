'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('general_body_meetings');
    if (!table.issued_proceedings_document_id) {
      await queryInterface.addColumn('general_body_meetings', 'issued_proceedings_document_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('general_body_meetings');
    if (table.issued_proceedings_document_id) {
      await queryInterface.removeColumn('general_body_meetings', 'issued_proceedings_document_id');
    }
  },
};
