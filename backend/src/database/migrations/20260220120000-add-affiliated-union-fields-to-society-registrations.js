'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('society_registrations');
    const columns = Object.keys(tableInfo);

    const fieldsToAdd = [
      {
        name: 'is_affiliated_union_federation',
        def: {
          type: Sequelize.STRING(10),
          allowNull: true,
          comment: 'Whether society is affiliated to union/federation (e.g. yes/no or 0/1)'
        }
      },
      {
        name: 'affiliated_union_level',
        def: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Level of affiliated union'
        }
      },
      {
        name: 'affiliated_union_name',
        def: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'Name of affiliated union/federation'
        }
      }
    ];

    for (const { name, def } of fieldsToAdd) {
      if (!columns.includes(name)) {
        await queryInterface.addColumn('society_registrations', name, def);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('society_registrations');
    const columns = Object.keys(tableInfo);
    const toRemove = ['is_affiliated_union_federation', 'affiliated_union_level', 'affiliated_union_name'];
    for (const col of toRemove) {
      if (columns.includes(col)) {
        await queryInterface.removeColumn('society_registrations', col);
      }
    }
  }
};
