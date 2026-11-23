'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const roles = [
      {
        id: require('uuid').v4(),
        name: 'drcs_arcs_district',
        description: 'DRCS/ARCS District',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'drcs_arcs_hq',
        description: 'DRCS/ARCS HQ',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'drcs_arcs_auditor',
        description: 'DRCS/ARCS Auditor',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'jics_sics_district',
        description: 'JICS/SICS District',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'jics_sics_hq',
        description: 'JICS/SICS HQ',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'jics_sics_liquidator',
        description: 'JICS/SICS Liquidator',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'jics_sics_auditor',
        description: 'JICS/SICS Auditor',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'dept_jics_sics',
        description: 'Department JICS/SICS',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'jt_rcs_district',
        description: 'JT RCS District',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'rcs_district',
        description: 'RCS District',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'applicant',
        description: 'Applicant',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'admin',
        description: 'Admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        name: 'jt_rcs_hq',
        description: 'JT RCS HQ',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const roleNames = roles.map(r => r.name);
    const existing = await queryInterface.sequelize.query(
      `SELECT name FROM roles WHERE name IN (:names)`,
      { replacements: { names: roleNames }, type: Sequelize.QueryTypes.SELECT }
    );

    const existingNames = new Set((existing || []).map(r => r.name));
    const toInsert = roles.filter(r => !existingNames.has(r.name));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('roles', toInsert, {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', {
      name: [
        'drcs_arcs_district',
        'drcs_arcs_hq',
        'drcs_arcs_auditor',
        'jics_sics_district',
        'jics_sics_hq',
        'jics_sics_liquidator',
        'jics_sics_auditor',
        'dept_jics_sics',
        'jt_rcs_district',
        'jt_rcs_hq',
        'rcs_district',
        'applicant',
        'admin'
      ]
    }, {});
  }
};
