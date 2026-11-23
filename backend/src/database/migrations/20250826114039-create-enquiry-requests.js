'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('enquiry_requests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      society_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'society_registrations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      district_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'districts', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      // 1. Applicant Details
      applicant_name: { type: Sequelize.STRING, allowNull: false },
      applicant_type: { type: Sequelize.ENUM('Member', 'Office Bearer', 'General Public', 'Other'), allowNull: false },
      contact_number: { type: Sequelize.STRING, allowNull: false },
      email_id: { type: Sequelize.STRING },
      address: { type: Sequelize.TEXT },

      // 2. Society Details
      society_registration_number: { type: Sequelize.STRING },
      society_name: { type: Sequelize.STRING },
      society_address: { type: Sequelize.TEXT },
      district: { type: Sequelize.STRING },
      subdivision: { type: Sequelize.STRING },
      state: { type: Sequelize.STRING },

      // 3. Enquiry/Inspection Request Details
      subject: { type: Sequelize.ENUM('Complaint', 'Irregularity', 'Routine Check', 'Other'), allowNull: false },
      description: { type: Sequelize.TEXT },
      preferred_office_level: { type: Sequelize.ENUM('State', 'District', 'Subdivision') },
      date_of_incident: { type: Sequelize.DATE },

      // 4. Supporting Information
      documents: { type: Sequelize.UUID, allowNull: true, references: { model: 'media', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      previous_reference_number: { type: Sequelize.STRING },

      // Timestamps
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      status: { type: Sequelize.UUID, allowNull: true, references: { model: 'statuses', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      status_changed_at: { type: Sequelize.DATE, allowNull: true },
      status_changed_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      updated_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('enquiry_requests');
  }
};
