'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('liquidations', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },

      // 1. Basic Society Information
      society_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'society_registrations', key: 'id' }, // assuming this table exists
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      society_registration_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      society_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      society_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      date_of_original_registration: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      date_of_minutes_meeting: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      minutes_meeting_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'media', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      attendance_sheet_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'media', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      date_of_circular_notice: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      circular_notice_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'media', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      // 2. Liquidation Order Details
      liquidation_order_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      date_of_liquidation_order: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      mode_of_liquidation: {
        type: Sequelize.ENUM('voluntary', 'compulsory'),
        allowNull: false,
      },
      reason_for_liquidation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // 4. Financial Position
      total_assets: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      total_liabilities: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      net_position: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      share_capital_paid_up: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      reserve_funds: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      creditors_list_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'media', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      members_list_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'media', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      // System Fields
      status: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'statuses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      liquidation_person: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('liquidations');
  },
};
