'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if the table exists
    const tableExists = await queryInterface.showAllTables();
    if (!tableExists.includes('society_registrations')) {
      // Create the table with UUID id if it doesn't exist
      await queryInterface.createTable('society_registrations', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        society_id: {
          type: Sequelize.STRING(40),
          allowNull: false
        },
        cooperative_society_name: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        local_langauge_society_name: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        registration_authoritie_id: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        reference_year: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        date_registration: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        registration_number: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        cooperative_society_type_id: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        area_of_operation_id: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        water_body_type_id: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        sector_of_operation_type: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        sector_of_operation: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        functional_status: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        location_of_head_quarter: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        state_id: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        district_id: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        block_id: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        gram_panchayat_id: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        village_code: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        urban_local_body_type: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        urban_local_body_code: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        locality_ward_code: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        pincode: {
          type: Sequelize.STRING(6),
          allowNull: true
        },
        full_address: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        contact_person: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        designation: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        mobile: {
          type: Sequelize.STRING(10),
          allowNull: true
        },
        landline: {
          type: Sequelize.STRING(12),
          allowNull: true
        },
        email: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        financial_audit: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        audit_complete_year: {
          type: Sequelize.STRING(5),
          allowNull: true
        },
        category_audit: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        is_profit_making: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        annual_turnover: {
          type: Sequelize.DECIMAL(17, 2),
          allowNull: true
        },
        annual_loss: {
          type: Sequelize.DECIMAL(17, 3),
          allowNull: true
        },
        is_dividend_paid: {
          type: Sequelize.STRING(10),
          allowNull: true
        },
        dividend_rate: {
          type: Sequelize.DECIMAL(10, 3),
          allowNull: true
        },
        operation_area_location: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        bank_type: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        cooperative_society_bank_id: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        other_bank: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        pan_no: {
          type: Sequelize.STRING(12),
          allowNull: true
        },
        gst_no: {
          type: Sequelize.STRING(40),
          allowNull: true
        },
        how_many_branches: {
          type: Sequelize.STRING(10),
          allowNull: true
        },
        full_time_secretary: {
          type: Sequelize.STRING(10),
          allowNull: true
        },
        mobile_number_of_secretary: {
          type: Sequelize.STRING(10),
          allowNull: true
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
      await queryInterface.addIndex('society_registrations', ['society_id']);
      await queryInterface.addIndex('society_registrations', ['registration_number']);
      await queryInterface.addIndex('society_registrations', ['state_id']);
      await queryInterface.addIndex('society_registrations', ['district_id']);
      await queryInterface.addIndex('society_registrations', ['cooperative_society_type_id']);
      await queryInterface.addIndex('society_registrations', ['registration_authoritie_id']);
      await queryInterface.addIndex('society_registrations', ['water_body_type_id']);
      await queryInterface.addIndex('society_registrations', ['sector_of_operation']);
    } else {
      // Table exists, try to modify the id column
      try {
        // Try to remove the primary key constraint if it exists
        await queryInterface.removeConstraint('society_registrations', 'PRIMARY');
      } catch (error) {
        // Constraint might not exist, continue
        console.log('Primary key constraint removal skipped:', error.message);
      }
      
      // Change the id column from INTEGER to UUID
      await queryInterface.changeColumn('society_registrations', 'id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // Revert back to INTEGER
    try {
      await queryInterface.removeConstraint('society_registrations', 'PRIMARY');
    } catch (error) {
      console.log('Primary key constraint removal skipped:', error.message);
    }
    
    await queryInterface.changeColumn('society_registrations', 'id', {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    });
  }
};
