'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const certificateStatus = [
            {
                id: require('uuid').v4(),
                key: 'certificate_issued',
                title: 'Certificate Issued',
                description: 'Certificate has been issued to the society',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        const existing = await queryInterface.sequelize.query(
            `SELECT \`key\` FROM statuses WHERE \`key\` IN (:keys)`,
            { replacements: { keys: certificateStatus.map(s => s.key) }, type: Sequelize.QueryTypes.SELECT }
        );
        const existingKeys = new Set((existing || []).map(r => r.key));
        const toInsert = certificateStatus.filter(s => !existingKeys.has(s.key));

        if (toInsert.length > 0) {
            await queryInterface.bulkInsert('statuses', toInsert, {});
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('statuses', {
            key: ['certificate_issued']
        }, {});
    }
};
