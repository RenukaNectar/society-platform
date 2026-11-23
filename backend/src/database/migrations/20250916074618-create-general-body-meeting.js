'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('general_body_meetings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      society_id: {
        type: Sequelize.UUID,
        references: {
          model: 'society_registrations', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      society_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      meeting_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      chairman_name: {
        type: Sequelize.STRING
      },
      total_shareholders: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      attended_shareholders: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      createdAt: {
        allowNull: true,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('general_body_meetings');
  }
};