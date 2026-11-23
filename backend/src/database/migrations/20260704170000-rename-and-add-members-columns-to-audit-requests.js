'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('audit_requests', 'total_members_on_roll', 'agm_total_members_on_roll');
    await queryInterface.renameColumn('audit_requests', 'members_attended', 'agm_members_attended');

    await queryInterface.addColumn('audit_requests', 'bod_total_members_on_roll', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'agm_members_attended'
    });
    await queryInterface.addColumn('audit_requests', 'bod_members_attended', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'bod_total_members_on_roll'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('audit_requests', 'bod_members_attended');
    await queryInterface.removeColumn('audit_requests', 'bod_total_members_on_roll');

    await queryInterface.renameColumn('audit_requests', 'agm_total_members_on_roll', 'total_members_on_roll');
    await queryInterface.renameColumn('audit_requests', 'agm_members_attended', 'members_attended');
  }
};
