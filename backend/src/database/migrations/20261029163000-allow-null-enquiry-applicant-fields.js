'use strict';

/** District and Head Office initiate inquiry/inspection without an applicant. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE enquiry_requests
      MODIFY COLUMN applicant_name VARCHAR(255) NULL,
      MODIFY COLUMN applicant_type ENUM(
        'Member',
        'Office Bearer',
        'General Public',
        'Other'
      ) NULL,
      MODIFY COLUMN contact_number VARCHAR(255) NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE enquiry_requests
      SET applicant_name = ''
      WHERE applicant_name IS NULL
    `);
    await queryInterface.sequelize.query(`
      UPDATE enquiry_requests
      SET contact_number = ''
      WHERE contact_number IS NULL
    `);
    await queryInterface.sequelize.query(`
      UPDATE enquiry_requests
      SET applicant_type = 'Member'
      WHERE applicant_type IS NULL
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE enquiry_requests
      MODIFY COLUMN applicant_name VARCHAR(255) NOT NULL,
      MODIFY COLUMN applicant_type ENUM(
        'Member',
        'Office Bearer',
        'General Public',
        'Other'
      ) NOT NULL,
      MODIFY COLUMN contact_number VARCHAR(255) NOT NULL
    `);
  },
};
