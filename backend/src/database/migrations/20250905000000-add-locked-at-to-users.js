'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up (queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'locked_at', {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },
    async down (queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'locked_at');
    }
};