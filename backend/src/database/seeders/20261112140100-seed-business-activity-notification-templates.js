'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const existingTemplates = await queryInterface.sequelize.query(
      'SELECT `key` FROM notification_templates',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingKeys = existingTemplates.map((t) => t.key);

    const templates = [
      {
        id: uuidv4(),
        key: 'business_activity_submit',
        title: 'Business Activity Submitted',
        description: '{{username}} has submitted business activity for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        key: 'business_activity_forward',
        title: 'Business Activity Forwarded',
        description: '{{username}} has forwarded business activity for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        key: 'business_activity_approved',
        title: 'Business Activity Approved',
        description: '{{username}} has approved business activity for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        key: 'business_activity_rejected',
        title: 'Business Activity Rejected',
        description: '{{username}} has rejected business activity for {{SocietyName}} society',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const newTemplates = templates.filter((t) => !existingKeys.includes(t.key));

    if (newTemplates.length > 0) {
      await queryInterface.bulkInsert('notification_templates', newTemplates, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'notification_templates',
      {
        key: {
          [Sequelize.Op.in]: [
            'business_activity_submit',
            'business_activity_forward',
            'business_activity_approved',
            'business_activity_rejected',
          ],
        },
      },
      {}
    );
  },
};
