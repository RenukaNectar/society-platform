'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    const updateStatuses = [
      {
        id: require('uuid').v4(),
        key: 'senior_inspector_approved',
        title: 'Senior Inspector Approved',
        description: 'Application has been approved by senior inspector',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'senior_inspector_rejected',
        title: 'Senior Inspector Rejected',
        description: 'Application has been rejected by senior inspector',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'joint_registrar_approved',
        title: 'Joint Registrar Approved',
        description: 'Application has been approved by joint registrar',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'joint_registrar_rejected',
        title: 'Joint Registrar Rejected',
        description: 'Application has been rejected by joint registrar',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'deputy_registrar_approved',
        title: 'Deputy Registrar Approved',
        description: 'Application has been approved by deputy registrar',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'deputy_registrar_rejected',
        title: 'Deputy Registrar Rejected',
        description: 'Application has been rejected by deputy registrar',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'ARC_approved',
        title: 'ARC Approved',
        description: 'Application has been approved by ARC',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'ARC_rejected',
        title: 'ARC Rejected',
        description: 'Application has been rejected by ARC',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
    ];

    const existing = await queryInterface.sequelize.query(
      `SELECT \`key\` FROM statuses WHERE \`key\` IN (:keys)`,
      { replacements: { keys: updateStatuses.map(s => s.key) }, type: Sequelize.QueryTypes.SELECT }
    );
    const existingKeys = new Set((existing || []).map(r => r.key));
    const toInsert = updateStatuses.filter(s => !existingKeys.has(s.key));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('statuses', toInsert, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('statuses', {
      key: {
        [Sequelize.Op.in]: [
          'senior_inspector_approved',
          'senior_inspector_rejected',
          'joint_registrar_approved',
          'joint_registrar_rejected',
          'deputy_registrar_approved',
          'deputy_registrar_rejected',
          'ARC_approved',
          'ARC_rejected'
        ]
      }
    }, {});
  }
};
