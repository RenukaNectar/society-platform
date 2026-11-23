'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      // Check if created_by column already exists
      const columns = await queryInterface.describeTable('statuses');
      const hasCreatedBy = columns.created_by !== undefined;
      const hasUpdatedBy = columns.updated_by !== undefined;

      // Add created_by column if it doesn't exist
      if (!hasCreatedBy) {
        await queryInterface.addColumn('statuses', 'created_by', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
        console.log('Added created_by column to statuses table');
      } else {
        console.log('created_by column already exists in statuses table');
      }

      // Add updated_by column if it doesn't exist
      if (!hasUpdatedBy) {
        await queryInterface.addColumn('statuses', 'updated_by', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
        console.log('Added updated_by column to statuses table');
      } else {
        console.log('updated_by column already exists in statuses table');
      }

      // Add indexes for better performance (only if columns were added)
      if (!hasCreatedBy) {
        await queryInterface.addIndex('statuses', ['created_by']);
      }
      if (!hasUpdatedBy) {
        await queryInterface.addIndex('statuses', ['updated_by']);
      }

    } catch (error) {
      console.log('Error adding audit fields to statuses table:', error.message);
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    try {
      // Check if columns exist before removing
      const columns = await queryInterface.describeTable('statuses');
      const hasCreatedBy = columns.created_by !== undefined;
      const hasUpdatedBy = columns.updated_by !== undefined;

      // Remove indexes first if they exist
      if (hasCreatedBy) {
        try {
          await queryInterface.removeIndex('statuses', ['created_by']);
        } catch (error) {
          console.log('Index for created_by in statuses might not exist');
        }
      }

      if (hasUpdatedBy) {
        try {
          await queryInterface.removeIndex('statuses', ['updated_by']);
        } catch (error) {
          console.log('Index for updated_by in statuses might not exist');
        }
      }

      // Remove columns if they exist
      if (hasCreatedBy) {
        await queryInterface.removeColumn('statuses', 'created_by');
        console.log('Removed created_by column from statuses table');
      }

      if (hasUpdatedBy) {
        await queryInterface.removeColumn('statuses', 'updated_by');
        console.log('Removed updated_by column from statuses table');
      }

    } catch (error) {
      console.log('Error removing audit fields from statuses table:', error.message);
      throw error;
    }
  }
};
