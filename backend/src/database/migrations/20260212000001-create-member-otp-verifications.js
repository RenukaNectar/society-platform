'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('member_otp_verifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      member_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'members',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      society_id: {
        type: Sequelize.STRING(40),
        allowNull: false
      },
      otp: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      otp_expiry: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      }
    });

    await queryInterface.addIndex('member_otp_verifications', ['member_id']);
    await queryInterface.addIndex('member_otp_verifications', ['society_id']);
    await queryInterface.addIndex('member_otp_verifications', ['otp_expiry']);
    await queryInterface.addIndex('member_otp_verifications', ['active']);
    await queryInterface.addIndex('member_otp_verifications', ['created_by']);
    await queryInterface.addIndex('member_otp_verifications', ['updated_by']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('member_otp_verifications');
  }
};
