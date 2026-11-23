'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const existingTemplates = await queryInterface.sequelize.query(
      `SELECT \`key\` FROM notification_templates`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingKeys = existingTemplates.map(t => t.key);

    const templates = [
              //amendment notification templates
              {
                id: uuidv4(),
                key: 'amendment_submit',
                title: 'Amendment Submitted',
                description: '{{username}} has submitted the amendment for {{SocietyName}} society',
                active: true,
                created_at: new Date(),
                updated_at: new Date()
              },
               {
                id: uuidv4(),
                key: 'amendment_forward',
                title: 'Amendment Forwarded',
                description: '{{username}} has forwarded the amendment for {{SocietyName}} society',
                active: true,
                created_at: new Date(),
                updated_at: new Date()
              },
              {
                id: uuidv4(),
                key: 'amendment_approved',
                title: 'Amendment Approved',
                description: '{{username}} has approved the amendment for {{SocietyName}} society',
                active: true,
                created_at: new Date(),
                updated_at: new Date()
              },
              {
                id: uuidv4(),
                key: 'amendment_rejected',
                title: 'Amendment Rejected',
                description: '{{username}} has rejected the amendment for {{SocietyName}} society',
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
        [Sequelize.Op.in]: ['amendment_submit', 'amendment_forward', 'amendment_approved', 'amendment_rejected']
      }
    }, {});
  }
};
