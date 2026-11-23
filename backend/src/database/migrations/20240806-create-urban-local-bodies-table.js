'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('urban_local_bodies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      state_code: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      state_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      district_code: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      district_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      localbody_type_code: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      localbody_type_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      localbody_type_name_hindi: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      localbody_code: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      local_body_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      local_body_name_hindi: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('urban_local_bodies');
  }
};