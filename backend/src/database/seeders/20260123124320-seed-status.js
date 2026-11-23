'use strict';
// Seed statuses table
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('statuses', [
      {
        id: require('uuid').v4(),
        key: 'renewal_submitted',
        title: 'Renewal Submitted',
        description: 'Renewal has been submitted by applicant',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
   
      {
        id: require('uuid').v4(),
        key: 'renewal_challan_uploaded',
        title: 'Renewal Challan Uploaded',
        description: 'Renewal challan has been uploaded by applicant',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'renewal_certificate_issued',
        title: 'Renewal Certificate Issued',
        description: 'Renewal certificate has been issued by RCS',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('statuses', {
      key: {
        [Sequelize.Op.in]: [
          'renewal_submitted',
          'renewal_challan_uploaded',
          'renewal_certificate_issued'
        ]
      }
    }, {});
  }
}; 