'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('amendments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      // Form fields from the amendment form
      chairperson_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Name of Chairperson/CEO/President/MD'
      },
      chairperson_address: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Address of Chairperson/CEO/President/MD'
      },
      chairperson_contact: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Contact Details of Chairperson/CEO/President/MD'
      },
      signatory_details: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Name, address, and contact details of signatory'
      },
      resolution_extract: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Extract of the resolution passed for the Byelaw amendment'
      },
      general_body_meeting_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date of General Body Meeting when amendment was discussed'
      },
      notice_days: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of days notice given to members for the meeting'
      },
      notice_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date of Notice of the General Body Meeting'
      },
      total_members: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Total number of members of the society'
      },
      quorum_required: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Quorum required to be present in the meeting'
      },
      members_present: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of members present in the meeting'
      },
      members_voted: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of members who voted in the meeting'
      },
      votes_in_favour: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of members who voted in favour of the resolution'
      },
      votes_against: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of members who voted against the resolution'
      },
      byelaw_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Byelaw number which is to be amended'
      },
      existing_byelaw: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Existing Byelaw to be amended'
      },
      new_proposed_byelaw: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'New Proposed Byelaw'
      },
      amendment_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for amendment'
      },
      proposed_byelaw_text: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Text of Proposed Byelaw'
      },
      
      // Workflow tracking fields
      society_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'society_registrations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      current_stage: {
        type: Sequelize.ENUM('draft', 'submitted', 'officer_review', 'qrcs_review', 'approved', 'rejected'),
        defaultValue: 'draft',
        allowNull: false
      },
      submission_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      certificate_issued: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      certificate_issue_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      certificate_number: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      
      // Audit fields
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      status_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'statuses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('amendments', ['society_id']);
    await queryInterface.addIndex('amendments', ['created_by']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('amendments');
  }
}; 