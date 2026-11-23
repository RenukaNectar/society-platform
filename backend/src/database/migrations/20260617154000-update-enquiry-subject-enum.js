'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE enquiry_requests
      MODIFY COLUMN subject ENUM(
        'Inquiry',
        'Inspection',
        'Complaint',
        'Irregularity',
        'Routine Check',
        'Other'
      ) NOT NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE enquiry_requests
      MODIFY COLUMN subject ENUM(
        'Complaint',
        'Irregularity',
        'Routine Check',
        'Other'
      ) NOT NULL
    `);
  },
};
