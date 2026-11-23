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
              //annual_filing notification templates
              {
                id: uuidv4(),
                key: 'annual_filing_submit',
                title: 'Annual Filing Submitted',
                description: '{{username}} has submitted the annual_filing for {{SocietyName}} society',
                active: true,
                created_at: new Date(),
                updated_at: new Date()
              },
               {
                id: uuidv4(),
                key: 'annual_filing_forward',
                title: 'Annual Filing Forwarded',
                description: '{{username}} has forwarded the annual_filing for {{SocietyName}} society',
                active: true,
                created_at: new Date(),
                updated_at: new Date()
              },
              {
                id: uuidv4(),
                key: 'annual_filing_approved',
                title: 'Annual Filing Approved',
                description: '{{username}} has approved the annual_filing for {{SocietyName}} society',
                active: true,
                created_at: new Date(),
                updated_at: new Date()
              },
              {
                id: uuidv4(),
                key: 'annual_filing_rejected',
                title: 'Annual Filing Rejected',
                description: '{{username}} has rejected the annual_filing for {{SocietyName}} society',
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
        [Sequelize.Op.in]: ['annual_filing_submit', 'annual_filing_forward', 'annual_filing_approved', 'annual_filing_rejected']
      }
    }, {});
  }
};
