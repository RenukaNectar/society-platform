'use strict';

/**
 * Align society_registrations.full_address with the Sequelize model (TEXT).
 * NCD sync fails on VARCHAR(255) when addresses exceed 255 characters.
 *
 * Idempotent: no-op when the column is already TEXT/MEDIUMTEXT/LONGTEXT.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [colInfo] = await queryInterface.sequelize.query(
      `SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'society_registrations'
         AND COLUMN_NAME = 'full_address'
       LIMIT 1`
    );

    if (!colInfo || colInfo.length === 0) {
      return;
    }

    const dataType = String(colInfo[0].DATA_TYPE || '').toLowerCase();
    if (dataType === 'text' || dataType === 'mediumtext' || dataType === 'longtext') {
      return;
    }

    await queryInterface.changeColumn('society_registrations', 'full_address', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    const [colInfo] = await queryInterface.sequelize.query(
      `SELECT DATA_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'society_registrations'
         AND COLUMN_NAME = 'full_address'
       LIMIT 1`
    );

    if (!colInfo || colInfo.length === 0) {
      return;
    }

    const dataType = String(colInfo[0].DATA_TYPE || '').toLowerCase();
    if (dataType === 'varchar') {
      return;
    }

    // Truncate only if reverting; values longer than 255 would otherwise fail.
    await queryInterface.sequelize.query(
      `UPDATE society_registrations
       SET full_address = LEFT(full_address, 255)
       WHERE full_address IS NOT NULL AND CHAR_LENGTH(full_address) > 255`
    );

    await queryInterface.changeColumn('society_registrations', 'full_address', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  }
};
