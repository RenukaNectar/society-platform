'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const defaultModules = [
      {
        id: require('uuid').v4(),
        name: 'New Registration of Cooperative Society',
        description: 'New Registration of Cooperative Society',
        key: 'SOCIETY_REGISTRATION',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Renewal of Cooperative Society',
        description: 'Renewal of Cooperative Society',
        key: 'SOCIETY_RENEWAL',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Conversion of Cooperative Society',
        description: 'Conversion of Cooperative Society',
        key: 'SOCIETY_CONVERSION',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Audit Request Workflow',
        description: 'Audit Request Workflow',
        key: 'AUDIT_REQUEST',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Liquidation of Cooperative Society',
        description: 'Liquidation of Cooperative Society',
        key: 'LIQUIDATION',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Liquidation of Cooperative Society (RCS)',
        description: 'Liquidation of Cooperative Society - RCS Office initiated workflow',
        key: 'LIQUIDATION_RCS',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Inspection & Inquiry',
        description: 'Inspection & Inquiry',
        key: 'INSPECTION_INQUIRY',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Election of Cooperative Society (Managing Committee / Board)',
        description: 'Election of Cooperative Society (Managing Committee / Board)',
        key: 'ELECTION',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Amendment of Bye-Laws / Rules of Cooperative Society',
        description: 'Amendment of Bye-Laws / Rules of Cooperative Society',
        key: 'AMENDMENT',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Special General Board Meeting',
        description: 'Special General Board Meeting',
        key: 'SGBM',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Annual General Meeting',
        description: 'Annual General Meeting',
        key: 'AGM',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Annual Filing',
        description: 'Annual Filing',
        key: 'ANNUAL_FILING',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'Appeal',
        description: 'Appeal',
        key: 'APPEAL',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('modules', defaultModules, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('modules', {
      key: {
        [Sequelize.Op.in]: [
          'SOCIETY_REGISTRATION',
          'SOCIETY_RENEWAL',
          'SOCIETY_CONVERSION',
          'AUDIT_REQUEST',
          'LIQUIDATION',
          'LIQUIDATION_RCS',
          'INSPECTION_INQUIRY',
          'ELECTION',
          'AMENDMENT',
          'SGBM',
          'AGM',
          'ANNUAL_FILING',
          'APPEAL'
        ]
      }
    }, {});
  }
};
