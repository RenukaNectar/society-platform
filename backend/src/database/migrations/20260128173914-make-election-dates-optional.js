'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('election_requests', 'last_election_held_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Date when last election was held (not applicable for new registration)'
    });
    
    await queryInterface.changeColumn('election_requests', 'last_elected_committee_expiry_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Date when last elected committee expires (not applicable for new registration)'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('election_requests', 'last_election_held_date', {
      type: Sequelize.DATEONLY,
      allowNull: false,
      comment: 'Date when last election was held'
    });
    
    await queryInterface.changeColumn('election_requests', 'last_elected_committee_expiry_date', {
      type: Sequelize.DATEONLY,
      allowNull: false,
      comment: 'Date when last elected committee expires'
    });
  }
};
