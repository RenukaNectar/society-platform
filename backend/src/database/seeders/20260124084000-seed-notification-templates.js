'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check which templates already exist
    const existingTemplates = await queryInterface.sequelize.query(
      `SELECT \`key\` FROM notification_templates`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingKeys = existingTemplates.map(t => t.key);

    const templates = [
      {
        id: uuidv4(),
        key: 'society_registration_submit',
        title: 'Application Submitted',
        description: '{{username}} has submitted the application for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_registration_forward',
        title: 'Application Forwarded',
        description: '{{username}} has forwarded the application for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_registration_rejected',
        title: 'Application Rejected',
        description: 'The application for {{SocietyName}} society has been rejected by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_registration_resubmitted',
        title: 'Application Resubmitted',
        description: '{{username}} has resubmitted the application for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_challan_uploaded',
        title: 'Challan Uploaded',
        description: '{{username}} has uploaded the challan for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_challan_pending',
        title: 'Challan Pending',
        description: 'Challan for {{SocietyName}} society is pending',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_certificate_issued',
        title: 'Certificate Issued',
        description: 'Certificate for {{SocietyName}} society has been issued by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },




      // conversion workflow
      {
        id: uuidv4(),
        key: 'society_conversion_submit',
        title: 'Conversion Application Submitted',
        description: '{{username}} has submitted the conversion application for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_conversion_forward',
        title: 'Conversion Application Forwarded',
        description: '{{username}} has forwarded the conversion application for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_conversion_approved',
        title: 'Conversion Application Approved',
        description: 'The conversion application for {{SocietyName}} society has been approved by {{username}}. RCS has issued: Conversion Certificate, Conversion Notification, and New Adopted Bye-Laws with all pages signed by RCS.',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_conversion_rejected',
        title: 'Conversion Application Rejected',
        description: 'The conversion application for {{SocietyName}} society has been rejected by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_conversion_resubmitted',
        title: 'Conversion Application Resubmitted',
        description: '{{username}} has resubmitted the conversion application for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_conversion_certificate_issued',
        title: 'Conversion Certificate Issued',
        description: 'Conversion certificate for {{SocietyName}} society has been issued by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },


      // renewal workflow
      {
        id: uuidv4(),
        key: 'society_renewal_challan_uploaded',
        title: 'Renewal Challan Uploaded',
        description: '{{username}} has uploaded the renewal challan for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_renewal_forwarded',
        title: 'Renewal Challan Forwarded',
        description: '{{username}} has forwarded the renewal challan for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_renewal_certificate_issued',
        title: 'Renewal Certificate Issued',
        description: 'Renewal certificate for {{SocietyName}} society has been issued by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'society_renewal_resubmitted',
        title: 'Renewal Application Resubmitted',
        description: '{{username}} has resubmitted the renewal application for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // liquidation workflow
      {
        id: uuidv4(),
        key: 'liquidation_submit',
        title: 'Liquidation Application Submitted',
        description: '{{username}} has submitted the liquidation application for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'liquidation_forward',
        title: 'Liquidation Application Forwarded',
        description: '{{username}} has forwarded the liquidation application for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'liquidation_rejected',
        title: 'Liquidation Application Rejected',
        description: 'The liquidation application for {{SocietyName}} society has been rejected by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'liquidation_liquidator_appointed',
        title: 'Liquidator Appointed',
        description: 'A liquidator has been appointed for the liquidation of {{SocietyName}} society by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'liquidation_liquidator_appointment_rejected',
        title: 'Liquidator Appointment Rejected',
        description: 'The liquidator appointment request for {{SocietyName}} society has been rejected by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'liquidation_report_submitted',
        title: 'Liquidation Report Submitted',
        description: '{{username}} has submitted the liquidation report for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'liquidation_auditor_appointed',
        title: 'Auditor Appointed',
        description: 'An auditor has been appointed to audit the liquidator\'s account for {{SocietyName}} society by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'liquidation_auditor_appointment_rejected',
        title: 'Auditor Appointment Rejected',
        description: 'The auditor appointment request for {{SocietyName}} society has been rejected by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'liquidation_audit_report_submitted',
        title: 'Audit Report Submitted',
        description: '{{username}} has submitted the audit report for {{SocietyName}} society liquidation',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'liquidation_approved',
        title: 'Liquidation Approved',
        description: 'The liquidation of {{SocietyName}} society has been approved by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'liquidation_final_rejected',
        title: 'Liquidation Rejected',
        description: 'The final liquidation request for {{SocietyName}} society has been rejected by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // AGM (Annual General Meeting) workflow
      {
        id: uuidv4(),
        key: 'agm_submit',
        title: 'AGM Application Submitted',
        description: '{{username}} has submitted the AGM application for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'agm_forward',
        title: 'AGM Application Forwarded',
        description: '{{username}} has forwarded the AGM application for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'agm_approved',
        title: 'AGM Approved',
        description: 'The AGM application for {{SocietyName}} society has been approved by RCS. Notification sent to all officers and applicant.',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'agm_rejected',
        title: 'AGM Application Reverted/Rejected',
        description: 'The AGM application for {{SocietyName}} society has been reverted/rejected by {{username}}',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

    ];

    // Filter out templates that already exist
    const newTemplates = templates.filter(t => !existingKeys.includes(t.key));

    if (newTemplates.length > 0) {
      await queryInterface.bulkInsert('notification_templates', newTemplates, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('notification_templates', {
      key: {
        [Sequelize.Op.in]: ['society_registration_submit', 'society_registration_forward', 'society_registration_rejected', 'society_registration_resubmitted', 'society_challan_uploaded', 'society_challan_pending', 'society_certificate_issued', 'society_conversion_submit', 'society_conversion_forward', 'society_conversion_approved', 'society_conversion_rejected', 'society_conversion_resubmitted', 'society_conversion_certificate_issued', 'society_renewal_challan_uploaded', 'society_renewal_forwarded', 'society_renewal_certificate_issued', 'society_renewal_resubmitted', 'liquidation_submit', 'liquidation_forward', 'liquidation_rejected', 'liquidation_liquidator_appointed', 'liquidation_liquidator_appointment_rejected', 'liquidation_report_submitted', 'liquidation_auditor_appointed', 'liquidation_auditor_appointment_rejected', 'liquidation_audit_report_submitted', 'liquidation_approved', 'liquidation_final_rejected', 'agm_submit', 'agm_forward', 'agm_approved', 'agm_rejected']
      }
    }, {});
  }
};
