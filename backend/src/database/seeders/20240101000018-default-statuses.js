'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const statuses = [
      // SOCIETY REGISTRATION
      {
        id: require('uuid').v4(),
        key: 'application_submitted',
        title: 'Application Submitted',
        description: 'Society registration application has been submitted',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'drcs_district_forwarded',
        title: 'DRCS District Forwarded',
        description: 'Application has been forwarded by DRCS at district level',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'drcs_district_rejected',
        title: 'DRCS District Rejected',
        description: 'Application has been rejected by DRCS at district level',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'sics_district_forwarded',
        title: 'SICS District Forwarded',
        description: 'Application has been forwarded by SICS at district level',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'sics_district_rejected',
        title: 'SICS District Rejected',
        description: 'Application has been rejected by SICS at district level',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'drcs_hq_forwarded',
        title: 'DRCS HQ Forwarded',
        description: 'Application has been forwarded by DRCS at headquarters level',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'drcs_hq_rejected',
        title: 'DRCS HQ Rejected',
        description: 'Application has been rejected by DRCS at headquarters level',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'sics_hq_forwarded',
        title: 'SICS HQ Forwarded',
        description: 'Application has been forwarded by SICS at headquarters level',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'sics_hq_rejected',
        title: 'SICS HQ Rejected',
        description: 'Application has been rejected by SICS at headquarters level',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'jt_rcs_district_forwarded',
        title: 'JT RCS District Forwarded',
        description: 'Application has been forwarded by Joint RCS at district level',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'jt_rcs_district_rejected',
        title: 'JT RCS District Rejected',
        description: 'Application has been rejected by Joint RCS at district level',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'jt_rcs_hq_forwarded',
        title: 'JT RCS HQ Forwarded',
        description: 'Application has been forwarded by Joint RCS at headquarters level',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'jt_rcs_hq_rejected',
        title: 'JT RCS HQ Rejected',
        description: 'Application has been rejected by Joint RCS at headquarters level',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'rcs_approved',
        title: 'RCS Approved',
        description: 'Application has been approved by RCS',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'rcs_rejected',
        title: 'RCS Rejected',
        description: 'Application has been rejected by RCS',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'challan_uploaded',
        title: 'Challan Uploaded',
        description: 'Challan has been uploaded',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'registration_certificate_issued',
        title: 'Registration Certificate Issued',
        description: 'Registration certificate has been issued',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        key: 'challan_upload_pending',
        title: 'Challan Upload Pending',
        description: 'Challan upload is pending',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const existing = await queryInterface.sequelize.query(
      `SELECT \`key\` FROM statuses WHERE \`key\` IN (:keys)`,
      { replacements: { keys: statuses.map(s => s.key) }, type: Sequelize.QueryTypes.SELECT }
    );
    const existingKeys = new Set((existing || []).map(r => r.key));
    const toInsert = statuses.filter(s => !existingKeys.has(s.key));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('statuses', toInsert, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('statuses', {
      key: [
        'application_submitted',
        'drcs_district_forwarded',
        'drcs_district_rejected',
        'sics_district_forwarded',
        'sics_district_rejected',
        'drcs_hq_forwarded',
        'drcs_hq_rejected',
        'sics_hq_forwarded',
        'sics_hq_rejected',
        'jt_rcs_district_forwarded',
        'jt_rcs_district_rejected',
        'jt_rcs_hq_forwarded',
        'jt_rcs_hq_rejected',
        'rcs_approved',
        'rcs_rejected',
        'challan_uploaded',
        'registration_certificate_issued',
        'challan_upload_pending'
      ]
    }, {});
  }
}; 