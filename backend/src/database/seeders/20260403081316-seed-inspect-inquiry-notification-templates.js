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
          //inspection notification templates
          {
            id: uuidv4(),
            key: 'inspection_submit',
            title: 'Inspection Application Submitted',
            description: '{{username}} has submitted the application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
           {
            id: uuidv4(),
            key: 'inspection_forward',
            title: 'Inspection Application Forwarded',
            description: '{{username}} has forwarded the application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            key: 'inspection_approved',
            title: 'Inspection Application Approved',
            description: '{{username}} has approved the Inspection application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            key: 'inspection_rejected',
            title: 'Inspection Application Rejected',
            description: '{{username}} has rejected the Inspection application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          //inquiry notification templates
          {
            id: uuidv4(),
            key: 'inspection_inquiry_submit',
            title: 'Inquiry Application Submitted',
            description: '{{username}} has submitted the application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
           {
            id: uuidv4(),
            key: 'inspection_inquiry_forward',
            title: 'Inquiry Application Forwarded',
            description: '{{username}} has forwarded the application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            key: 'inspection_inquiry_approved',
            title: 'Inquiry Application Approved',
            description: '{{username}} has approved the Inquiry application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            key: 'inspection_inquiry_rejected',
            title: 'Inquiry Application Rejected',
            description: '{{username}} has rejected the Inquiry application for {{SocietyName}} society',
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
        [Sequelize.Op.in]: ['inspection_submit', 'inspection_forward', 'inspection_approved', 'inspection_rejected', 'inspection_inquiry_submit', 'inspection_inquiry_forward', 'inspection_inquiry_approved', 'inspection_inquiry_rejected']
      }
    }, {});
  }
};
