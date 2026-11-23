'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check which templates already exist
    const existingTemplates = await queryInterface.sequelize.query(
      `SELECT \`key\` FROM notification_templates`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingKeys = existingTemplates.map(t => t.key);

    const templates = [
          {
            id: uuidv4(),
            key: 'audit_request_submit',
            title: 'Application Submitted',
            description: '{{username}} has submitted the application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
           {
            id: uuidv4(),
            key: 'audit_request_forward',
            title: 'Audit Request Application Forwarded',
            description: '{{username}} has forwarded the application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            key: 'audit_request_approved',
            title: 'Audit Request Application Approved',
            description: '{{username}} has approved the Audit Request application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            key: 'audit_request_rejected',
            title: 'Audit Request Application Rejected',
            description: '{{username}} has rejected the Audit Request application for {{SocietyName}} society',
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

  async down (queryInterface, Sequelize) {
   await queryInterface.bulkDelete('notification_templates', {
      key: {
        [Sequelize.Op.in]: ['audit_request_submit', 'audit_request_forward', 'audit_request_approved', 'audit_request_rejected']
      }
    }, {});
  }
};
