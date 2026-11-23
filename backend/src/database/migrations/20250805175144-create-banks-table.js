'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('banks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      ifsc_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      micr_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      branch_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      pincode: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      is_active: {
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
      }
    });

    // Add indexes
    await queryInterface.addIndex('banks', ['name']);
    await queryInterface.addIndex('banks', ['code']);
    await queryInterface.addIndex('banks', ['type']);
    await queryInterface.addIndex('banks', ['ifsc_code']);
    await queryInterface.addIndex('banks', ['is_active']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('banks');
  }
};
