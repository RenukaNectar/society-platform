'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('society_types', [
      {
        id: Sequelize.literal('UUID()'),
        title: 'housing',
        description: 'A cooperative society formed for the purpose of providing housing to its members',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        title: 'credit',
        description: 'A cooperative society that provides credit and financial services to its members',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        title: 'consumer',
        description: 'A cooperative society that provides consumer goods and services to its members',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        title: 'dairy',
        description: 'A cooperative society that provides dairy products to its members',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        title: 'agricultural',
        description: 'A cooperative society that provides agricultural services to its members',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        title: 'industrial',
        description: 'A cooperative society that provides industrial services to its members',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        title: 'service',
        description: 'A cooperative society that provides service services to its members',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        title: 'other',
        description: 'A cooperative society that provides other services to its members',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('society_types', null, {});
  }
};
