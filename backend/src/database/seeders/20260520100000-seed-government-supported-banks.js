'use strict';

const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

/** Bank names to ensure exist; skips any name already in `banks`. */
const BANK_ROWS = [
  { name: 'State Bank of India', code: 'SBI', type: 'Commercial' },
  { name: 'Punjab National Bank', code: 'PNB', type: 'Commercial' },
  { name: 'Bank of Baroda', code: 'BOB', type: 'Commercial' },
  { name: 'Canara Bank', code: 'CNBR', type: 'Commercial' },
  { name: 'Union Bank of India', code: 'UBI', type: 'Commercial' },
  { name: 'Indian Bank', code: 'INDB', type: 'Commercial' },
  { name: 'Bank of India', code: 'BOI', type: 'Commercial' },
  { name: 'Central Bank of India', code: 'CBIN', type: 'Commercial' },
  { name: 'UCO Bank', code: 'UCO', type: 'Commercial' },
  { name: 'Punjab & Sind Bank', code: 'PSIB', type: 'Commercial' },
  {
    name: 'Regional Rural Bank (Government-Supported)',
    code: 'RRB_GOV',
    type: 'Cooperative'
  },
  {
    name: 'Arunachal Pradesh Rural Bank',
    code: 'APRB',
    type: 'Cooperative',
    state: 'Arunachal Pradesh',
    city: 'Naharlagun'
  },
  { name: 'State Cooperative Bank', code: 'STCB', type: 'Cooperative' },
  {
    name: 'Arunachal Pradesh State Cooperative Apex Bank Ltd.',
    code: 'APSCAB',
    type: 'Cooperative',
    state: 'Arunachal Pradesh',
    city: 'Naharlagun'
  }
];

const BANK_NAMES = BANK_ROWS.map((r) => r.name);

/** Already inserted by `20240101000017-default-banks.js` — do not remove on rollback. */
const PRE_EXISTING_DEFAULT_BANK_NAMES = new Set([
  'State Bank of India',
  'Punjab National Bank'
]);

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.sequelize.query(
      `SELECT name FROM banks WHERE name IN (:names)`,
      {
        replacements: { names: BANK_NAMES },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const existingNames = new Set(
      (existing || []).map((r) => String(r.name).trim().toLowerCase())
    );

    const now = new Date();
    const toInsert = BANK_ROWS.filter(
      (row) => !existingNames.has(row.name.trim().toLowerCase())
    ).map((row) => ({
      id: uuidv4(),
      name: row.name,
      code: row.code,
      type: row.type,
      ifsc_code: null,
      micr_code: null,
      branch_name: row.branch_name || null,
      address: row.address || null,
      city: row.city || null,
      state: row.state || null,
      pincode: row.pincode || null,
      phone: row.phone || null,
      email: row.email || null,
      is_active: true,
      created_at: now,
      updated_at: now
    }));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('banks', toInsert, {});
    }
  },

  async down(queryInterface) {
    const namesToRemove = BANK_NAMES.filter(
      (name) => !PRE_EXISTING_DEFAULT_BANK_NAMES.has(name)
    );
    if (namesToRemove.length === 0) return;

    await queryInterface.bulkDelete(
      'banks',
      {
        name: {
          [Op.in]: namesToRemove
        }
      },
      {}
    );
  }
};
