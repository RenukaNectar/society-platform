'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('districts_blocks_gp_villages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      state_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      state_code: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      district_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      district_code: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      block_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      block_code: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      gram_panchayat_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      gram_panchayat_code: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      gram_panchayat_name_hindi: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      village_code: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      village_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      village_name_hindi: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    });

    // Add indexes with error handling
    try {
      await queryInterface.addIndex('districts_blocks_gp_villages', ['state_code']);
    } catch (error) {
      console.log('Index on state_code already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('districts_blocks_gp_villages', ['district_code']);
    } catch (error) {
      console.log('Index on district_code already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('districts_blocks_gp_villages', ['block_code']);
    } catch (error) {
      console.log('Index on block_code already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('districts_blocks_gp_villages', ['gram_panchayat_code']);
    } catch (error) {
      console.log('Index on gram_panchayat_code already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('districts_blocks_gp_villages', ['village_code']);
    } catch (error) {
      console.log('Index on village_code already exists, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('districts_blocks_gp_villages');
  }
};