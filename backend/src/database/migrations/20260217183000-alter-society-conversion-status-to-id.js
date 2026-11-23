'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    const [[statusCol]] = await sequelize.query(
      `SHOW FULL COLUMNS FROM society_conversion LIKE 'status'`
    );

    // If a previous attempt already converted `status` to UUID (char(36)),
    // just align collation and add the FK constraint.
    if (statusCol && typeof statusCol.Type === 'string' && statusCol.Type.toLowerCase() === 'char(36)') {
      await sequelize.query(
        `ALTER TABLE society_conversion MODIFY status CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL`
      );

      try {
        await queryInterface.addConstraint('society_conversion', {
          fields: ['status'],
          type: 'foreign key',
          name: 'fk_society_conversion_status_statuses',
          references: {
            table: 'statuses',
            field: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        });
      } catch (e) {
        // Constraint may already exist; ignore to keep migration rerunnable.
      }

      return;
    }

    // Step 1: Add temporary UUID column for data migration
    await sequelize.query(
      `ALTER TABLE society_conversion ADD COLUMN status_temp CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    // Step 2: Migrate existing data: convert status key to status ID
    const statusesResult = await sequelize.query(
      `SELECT id, \`key\` FROM statuses`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Handle tuple return [results, metadata] or direct array
    const statuses = Array.isArray(statusesResult) && statusesResult.length === 2 && Array.isArray(statusesResult[0])
      ? statusesResult[0]
      : statusesResult;

    const statusMap = {};
    if (Array.isArray(statuses)) {
      statuses.forEach(s => {
        statusMap[s.key] = s.id;
      });
    } else {
      throw new Error(`Expected statuses to be an array, got ${typeof statuses}`);
    }

    // Update all rows: set status_temp based on status key
    const conversionsResult = await sequelize.query(
      `SELECT id, status FROM society_conversion WHERE status IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Handle tuple return [results, metadata] or direct array
    const conversions = Array.isArray(conversionsResult) && conversionsResult.length === 2 && Array.isArray(conversionsResult[0])
      ? conversionsResult[0]
      : conversionsResult;

    if (!Array.isArray(conversions)) {
      throw new Error(`Expected conversions to be an array, got ${typeof conversions}`);
    }

    for (const conversion of conversions) {
      const statusId = statusMap[conversion.status];
      if (statusId) {
        await queryInterface.sequelize.query(
          `UPDATE society_conversion SET status_temp = :statusId WHERE id = :id`,
          {
            replacements: { statusId, id: conversion.id },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      } else {
        console.warn(`Status key "${conversion.status}" not found for conversion ${conversion.id}`);
        // Set to submitted status as fallback
        const submittedStatusId = statusMap['submitted'];
        if (submittedStatusId) {
          await queryInterface.sequelize.query(
            `UPDATE society_conversion SET status_temp = :statusId WHERE id = :id`,
            {
              replacements: { statusId: submittedStatusId, id: conversion.id },
              type: Sequelize.QueryTypes.UPDATE
            }
          );
        }
      }
    }

    // Step 3: Drop old status column
    await queryInterface.removeColumn('society_conversion', 'status');

    // Step 4: Rename status_temp to status and add foreign key constraint
    await queryInterface.renameColumn('society_conversion', 'status_temp', 'status');

    // Step 5: Add foreign key constraint and make NOT NULL
    await sequelize.query(
      `ALTER TABLE society_conversion MODIFY status CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL`
    );
    await queryInterface.addConstraint('society_conversion', {
      fields: ['status'],
      type: 'foreign key',
      name: 'fk_society_conversion_status_statuses',
      references: {
        table: 'statuses',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },

  async down(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    // Step 1: Remove foreign key constraint (if present)
    try {
      await queryInterface.removeConstraint('society_conversion', 'fk_society_conversion_status_statuses');
    } catch (e) {
      // ignore
    }

    // Step 2: Make status nullable (UUID char(36))
    await sequelize.query(
      `ALTER TABLE society_conversion MODIFY status CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL`
    );

    // Step 3: Rename status to status_temp
    await queryInterface.renameColumn('society_conversion', 'status', 'status_temp');

    // Step 4: Add back status column as STRING
    await queryInterface.addColumn('society_conversion', 'status', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    // Step 5: Migrate data back: convert status ID to status key
    const statusesResult = await sequelize.query(
      `SELECT id, \`key\` FROM statuses`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Handle tuple return [results, metadata] or direct array
    const statuses = Array.isArray(statusesResult) && statusesResult.length === 2 && Array.isArray(statusesResult[0])
      ? statusesResult[0]
      : statusesResult;

    const statusIdMap = {};
    if (Array.isArray(statuses)) {
      statuses.forEach(s => {
        statusIdMap[s.id] = s.key;
      });
    } else {
      throw new Error(`Expected statuses to be an array, got ${typeof statuses}`);
    }

    const conversionsResult = await sequelize.query(
      `SELECT id, status_temp FROM society_conversion WHERE status_temp IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Handle tuple return [results, metadata] or direct array
    const conversions = Array.isArray(conversionsResult) && conversionsResult.length === 2 && Array.isArray(conversionsResult[0])
      ? conversionsResult[0]
      : conversionsResult;

    if (!Array.isArray(conversions)) {
      throw new Error(`Expected conversions to be an array, got ${typeof conversions}`);
    }

    for (const conversion of conversions) {
      const statusKey = statusIdMap[conversion.status_temp];
      if (statusKey) {
        await queryInterface.sequelize.query(
          `UPDATE society_conversion SET status = :statusKey WHERE id = :id`,
          {
            replacements: { statusKey, id: conversion.id },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      }
    }

    // Step 6: Make status NOT NULL
    await queryInterface.changeColumn('society_conversion', 'status', {
      type: Sequelize.STRING(50),
      allowNull: false
    });

    // Step 7: Drop status_temp column
    await queryInterface.removeColumn('society_conversion', 'status_temp');
  }
};
