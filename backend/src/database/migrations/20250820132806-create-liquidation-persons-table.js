'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('liquidation_persons', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      sl_no: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      mobile1: {
        type: Sequelize.STRING(15),
        allowNull: false
      },
      mobile2: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      email: {
        type: Sequelize.TEXT,
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('liquidation_persons');
  }
};
