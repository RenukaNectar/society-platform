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
          //election request notification templates
          {
            id: uuidv4(),
            key: 'election_request_submit',
            title: 'Election Request Submitted',
            description: '{{username}} has submitted the election request for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
           {
            id: uuidv4(),
            key: 'election_request_forward',
            title: 'Election Request Forwarded',
            description: '{{username}} has forwarded the election request for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            key: 'election_request_approved',
            title: 'Election Request Approved',
            description: '{{username}} has approved the election request for {{SocietyName}} society',
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            key: 'election_request_rejected',
            title: 'Election Request Rejected',
            description: '{{username}} has rejected the election request for {{SocietyName}} society',
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
        [Sequelize.Op.in]: ['election_request_submit', 'election_request_forward', 'election_request_approved', 'election_request_rejected']
      }
    }, {});
  }
};
