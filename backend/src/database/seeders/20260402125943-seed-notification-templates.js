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
        key: 'appeal_submit',
        title: 'Appeal Application Submitted',
        description: '{{username}} has submitted the application for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
            id: uuidv4(),
            key: 'appeal_forward',
            title: 'Appeal Application Forwarded',
            description: '{{username}} has forwarded the application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
      },
      {
            id: uuidv4(),
            key: 'appeal_approved',
            title: 'Appeal Application Approved',
            description: '{{username}} has approved the Appeal application for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
      },
      {
        id: uuidv4(),
        key: 'appeal_rejected',
        title: 'Appeal Application Rejected',
        description: '{{username}} has rejected the Appeal application for {{SocietyName}} society',
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
        [Sequelize.Op.in]: ['appeal_submit', 'appeal_forward', 'appeal_approved', 'appeal_rejected']
      }
    }, {});
  }
};
