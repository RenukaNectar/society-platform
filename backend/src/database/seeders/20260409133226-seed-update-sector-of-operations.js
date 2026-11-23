'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'sector_of_operations',
      {
        name: 'Dairy Multipurpose Cooperative',
        updated_at: new Date()
      },
      {
        code: '009' // Dairy Cooperative
      }
    );
    await queryInterface.bulkUpdate(
      'sector_of_operations',
      {
        name: 'Fishery Multipurpose Cooperative',
        updated_at: new Date()
      },
      {
        code: '010' // Fishery Cooperative
      }
    );
  },

  async down (queryInterface, Sequelize) {
    // Revert Dairy Cooperative
    await queryInterface.bulkUpdate(
      'sector_of_operations',
      {
        name: 'Multipurpose Dairy Cooperative Society',
        updated_at: new Date()
      },
      {
        code: '009'
      }
    );

    // Revert Fishery Cooperative
    await queryInterface.bulkUpdate(
      'sector_of_operations',
      {
        name: 'Multipurpose Fishery Cooperative Society',
        updated_at: new Date()
      },
      {
        code: '010'
      }
    );
  }
};
