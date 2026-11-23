'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('election_requests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      
      // Society Information
      society_registration_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'society_registrations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // Election Details
      last_election_held_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Date when last election was held'
      },
      
      last_elected_committee_expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Date when last elected committee expires'
      },
      
      reason_for_election_request: {
        type: Sequelize.ENUM('Regular Term', 'Early Dissolution', 'Court Order', 'Other'),
        allowNull: false,
        comment: 'Reason for requesting election'
      },
      
      proposed_election_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Proposed date for the election'
      },
      
      proposed_venue: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Proposed venue for the election'
      },
      
      number_of_members_eligible_to_vote: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Number of members eligible to vote'
      },
      
      // Document Uploads (Media References)
      member_list_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      meeting_resolution_copy_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      previous_election_report_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      // Status Information
      status_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'statuses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      
      submission_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date when the request was submitted'
      },
      
      assigned_officer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      officer_review_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date when officer reviewed the request'
      },
      
      approval_order_issued: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether approval order has been issued'
      },
      
      approval_order_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Approval order number if issued'
      },
      
      approval_order_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date when approval order was issued'
      },
      
      approval_order_document_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Path to approval order document'
      },
      
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for rejection if rejected'
      },
      
      rejection_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date when request was rejected'
      },
      
      additional_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes or remarks'
      },
      
      // Audit Fields
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
        defaultValue: Sequelize.NOW
      },
      
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('election_requests', ['society_registration_id']);
    await queryInterface.addIndex('election_requests', ['status_id']);
    await queryInterface.addIndex('election_requests', ['created_by']);
    await queryInterface.addIndex('election_requests', ['assigned_officer_id']);
    await queryInterface.addIndex('election_requests', ['proposed_election_date']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('election_requests');
  }
};
