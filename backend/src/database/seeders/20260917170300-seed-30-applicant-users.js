'use strict';

/**
 * Seeds 30 applicant users with unique emails.
 * Password for all: Abcd@1234
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260917170300-seed-30-applicant-users.js
 *
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260917170300-seed-30-applicant-users.js
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const USER_COUNT = 30;
const DEFAULT_PASSWORD = 'Abcd@1234';
const EMAIL_PREFIX = 'applicant';
const EMAIL_DOMAIN = 'seed.test';

function buildEmail(index) {
  const n = String(index).padStart(2, '0');
  return `${EMAIL_PREFIX}${n}@${EMAIL_DOMAIN}`;
}

function buildPan(index) {
  // PAN format: 5 letters + 4 digits + 1 letter
  const n = String(1000 + index).slice(-4);
  return `SEEDA${n}Z`;
}

function buildAadhar(index) {
  // 12 unique digits
  return String(900000000000 + index);
}

function buildPhone(index) {
  return String(9800000000 + index);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const [applicantRole] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = :name LIMIT 1`,
      {
        replacements: { name: 'applicant' },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!applicantRole?.id) {
      throw new Error('Applicant role not found. Run roles seeder first.');
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const now = new Date();
    let created = 0;
    let skipped = 0;

    for (let i = 1; i <= USER_COUNT; i++) {
      const email = buildEmail(i);
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = :email LIMIT 1`,
        {
          replacements: { email },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (existing && existing.length > 0) {
        console.log(`⚠ Already exists: ${email}`);
        skipped += 1;
        continue;
      }

      await queryInterface.bulkInsert('users', [
        {
          id: uuidv4(),
          email,
          password: hashedPassword,
          first_name: 'Applicant',
          last_name: String(i).padStart(2, '0'),
          phone: buildPhone(i),
          address: `Seed address ${i}`,
          aadhar_number: buildAadhar(i),
          pan_number: buildPan(i),
          role_id: applicantRole.id,
          is_active: true,
          is_hq: false,
          is_locked: false,
          failed_login_attempts: 0,
          last_login: null,
          reset_token: null,
          reset_token_expiry: null,
          created_at: now,
          updated_at: now
        }
      ]);

      console.log(`✓ Created: ${email}`);
      created += 1;
    }

    console.log(`\n✅ Applicant users seed done. created=${created}, skipped=${skipped}`);
    console.log(`📧 Password for all: ${DEFAULT_PASSWORD}`);
    console.log(`📧 Emails: ${buildEmail(1)} ... ${buildEmail(USER_COUNT)}`);
  },

  async down(queryInterface) {
    const emails = [];
    for (let i = 1; i <= USER_COUNT; i++) {
      emails.push(buildEmail(i));
    }

    await queryInterface.bulkDelete('users', {
      email: emails
    });
  }
};
