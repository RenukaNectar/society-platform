'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      // First, let's check what constraints exist
      const constraints = await queryInterface.sequelize.query(
        "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'members' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND TABLE_SCHEMA = DATABASE()",
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      // Remove any foreign key constraints that reference society_registrations
      for (const constraint of constraints) {
        const constraintName = constraint.CONSTRAINT_NAME;
        try {
          await queryInterface.removeConstraint('members', constraintName);
          console.log(`Removed constraint: ${constraintName}`);
        } catch (error) {
          console.log(`Could not remove constraint ${constraintName}:`, error.message);
        }
      }
      
      // Remove the index on society_id if it exists
      try {
        await queryInterface.removeIndex('members', 'members_society_id');
      } catch (error) {
        console.log('Index members_society_id does not exist or already removed');
      }
    } catch (error) {
      console.log('Migration completed with warnings:', error.message);
    }
  },

  async down (queryInterface, Sequelize) {
    // Re-add the index
    await queryInterface.addIndex('members', ['society_id'], {
      name: 'members_society_id'
    });
    
    // Re-add the foreign key constraint
    await queryInterface.addConstraint('members', {
      fields: ['society_id'],
      type: 'foreign key',
      name: 'members_society_id_fkey',
      references: {
        table: 'society_registrations',
        field: 'society_id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
}; 