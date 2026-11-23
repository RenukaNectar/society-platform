'use strict';

const LOCALBODY_CODE = '299596'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const [result] = await queryInterface.sequelize.query(
      `DELETE FROM urban_local_bodies
       WHERE localbody_code = :localbodyCode`,
      {
        replacements: {
          localbodyCode: LOCALBODY_CODE,
        },
      }
    );
    // console.log("RESULT----->", result);
  },

  async down (queryInterface, Sequelize) {
    // No automatic restore because the original record values are not known.
    // console.log(
    //   `Rollback not implemented for localbody_code=${LOCALBODY_CODE}`
    // );
  }
};
