'use strict';

/**
 * Adds udyam_no to society_registrations.
 * society_registrations is near InnoDB's 8126-byte row limit, so we:
 * 1) switch ROW_FORMAT to DYNAMIC (TEXT/VARCHAR off-page)
 * 2) add udyam_no as TEXT
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'society_registrations'
         AND COLUMN_NAME = 'udyam_no'
       LIMIT 1`
    );

    if (existing && existing.length > 0) {
      return;
    }

    // Allow row-format change on an already-wide table
    await queryInterface.sequelize.query('SET SESSION innodb_strict_mode = 0');

    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE `society_registrations` ROW_FORMAT = DYNAMIC'
      );
    } catch (err) {
      // Ignore if already DYNAMIC / unsupported; ADD COLUMN may still work after strict_mode=0
      // eslint-disable-next-line no-console
      console.warn(
        'ROW_FORMAT=DYNAMIC skipped/failed:',
        err && err.message ? err.message : err
      );
    }

    // Convert a few wide VARCHAR columns to TEXT to free in-row bytes if still needed
    const wideVarcharColumns = [
      'full_address',
      'cooperative_society_name',
      'local_langauge_society_name',
      'affiliated_union_name'
    ];

    for (const column of wideVarcharColumns) {
      const [colInfo] = await queryInterface.sequelize.query(
        `SELECT DATA_TYPE
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'society_registrations'
           AND COLUMN_NAME = :column
         LIMIT 1`,
        { replacements: { column } }
      );

      if (
        colInfo &&
        colInfo.length > 0 &&
        String(colInfo[0].DATA_TYPE || '').toLowerCase() === 'varchar'
      ) {
        await queryInterface.changeColumn('society_registrations', column, {
          type: Sequelize.TEXT,
          allowNull: true
        });
      }
    }

    await queryInterface.addColumn('society_registrations', 'udyam_no', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.sequelize.query('SET SESSION innodb_strict_mode = 1');
  },

  async down(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'society_registrations'
         AND COLUMN_NAME = 'udyam_no'
       LIMIT 1`
    );

    if (existing && existing.length > 0) {
      await queryInterface.removeColumn('society_registrations', 'udyam_no');
    }
  }
};
