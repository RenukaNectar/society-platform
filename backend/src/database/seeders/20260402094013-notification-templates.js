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
            key: 'bod_submit',
            title: 'BOD Application Submitted',
            description: '{{username}} has submitted the application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
           {
            id: uuidv4(),
            key: 'bod_forward',
            title: 'BOD Application Forwarded',
            description: '{{username}} has forwarded the application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            key: 'bod_approved',
            title: 'BOD Application Approved',
            description: '{{username}} has approved the BOD application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            key: 'bod_rejected',
            title: 'BOD Application Rejected',
            description: '{{username}} has rejected the BOD application for {{SocietyName}} society',
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
        [Sequelize.Op.in]: ['bod_submit', 'bod_forward', 'bod_approved', 'bod_rejected']
      }
    }, {});
  }
};
