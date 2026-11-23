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
          //sgbm notification templates
          {
            id: uuidv4(),
            key: 'sgbm_submit',
            title: 'SGBM Application Submitted',
            description: '{{username}} has submitted the application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
           {
            id: uuidv4(),
            key: 'sgbm_forward',
            title: 'SGBM Application Forwarded',
            description: '{{username}} has forwarded the application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            key: 'sgbm_approved',
            title: 'SGBM Application Approved',
            description: '{{username}} has approved the SGBM application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            key: 'sgbm_rejected',
            title: 'SGBM Application Rejected',
            description: '{{username}} has rejected the SGBM application for {{SocietyName}} society',
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
        [Sequelize.Op.in]: ['sgbm_submit', 'sgbm_forward', 'sgbm_approved', 'sgbm_rejected']
      }
    }, {});
  }
};
