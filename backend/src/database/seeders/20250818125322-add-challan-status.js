'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const challanStatus = [
            {
                id: require('uuid').v4(),
                key: 'challan_pending',
                title: 'Challan Upload Pending',
                description: 'Challan is pending to be paid',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: require('uuid').v4(),
                key: 'challan_rejected',
                title: 'Challan Rejected',
                description: 'Challan has been rejected',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: require('uuid').v4(),
                key: 'challan_uploaded',
                title: 'Challan Uploaded',
                description: 'Challan has been uploaded',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        const existing = await queryInterface.sequelize.query(
            `SELECT \`key\` FROM statuses WHERE \`key\` IN (:keys)`,
            { replacements: { keys: challanStatus.map(s => s.key) }, type: Sequelize.QueryTypes.SELECT }
        );
        const existingKeys = new Set((existing || []).map(r => r.key));
        const toInsert = challanStatus.filter(s => !existingKeys.has(s.key));

        if (toInsert.length > 0) {
            await queryInterface.bulkInsert('statuses', toInsert, {});
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('statuses', {
            key: ['challan_pending', 'challan_rejected', 'challan_uploaded']
        }, {});
    }
};
