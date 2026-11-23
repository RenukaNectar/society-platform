'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const districtId = '317cb066-e035-4119-b894-73b64b19387c';
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Get role IDs from database
    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('applicant', 'drcs_arcs_district', 'jics_sics_district', 'drcs_arcs_hq', 'jics_sics_hq', 'jt_rcs_hq', 'jt_rcs_district', 'rcs_district')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const roleMap = roles.reduce((acc, r) => {
      acc[r.name] = r.id;
      return acc;
    }, {});

    // Define users for each role
    const users = [
      {
        id: uuidv4(),
        email: 'applicant@test.com',
        password: hashedPassword,
        first_name: 'Applicant',
        last_name: 'User',
        phone: '9876543210',
        address: 'Test Address',
        aadhar_number: '123456789012',
        pan_number: 'ABCDE1234A',
        role_id: roleMap['applicant'],
        district_id: districtId,
        is_active: true,
        is_hq: false,
        is_locked: false,
        failed_login_attempts: 0,
        last_login: null,
        reset_token: null,
        reset_token_expiry: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'drcs_arcs_district@test.com',
        password: hashedPassword,
        first_name: 'DRCS',
        last_name: 'ARCS District',
        phone: '9876543211',
        address: 'Test Address',
        aadhar_number: '123456789013',
        pan_number: 'ABCDE1234B',
        role_id: roleMap['drcs_arcs_district'],
        district_id: districtId,
        is_active: true,
        is_hq: false,
        is_locked: false,
        failed_login_attempts: 0,
        last_login: null,
        reset_token: null,
        reset_token_expiry: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'jics_sics_district@test.com',
        password: hashedPassword,
        first_name: 'JICS',
        last_name: 'SICS District',
        phone: '9876543212',
        address: 'Test Address',
        aadhar_number: '123456789014',
        pan_number: 'ABCDE1234C',
        role_id: roleMap['jics_sics_district'],
        district_id: districtId,
        is_active: true,
        is_hq: false,
        is_locked: false,
        failed_login_attempts: 0,
        last_login: null,
        reset_token: null,
        reset_token_expiry: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'drcs_arcs_hq@test.com',
        password: hashedPassword,
        first_name: 'DRCS',
        last_name: 'ARCS HQ',
        phone: '9876543213',
        address: 'Test Address',
        aadhar_number: '123456789015',
        pan_number: 'ABCDE1234D',
        role_id: roleMap['drcs_arcs_hq'],
        district_id: districtId,
        is_active: true,
        is_hq: true,
        is_locked: false,
        failed_login_attempts: 0,
        last_login: null,
        reset_token: null,
        reset_token_expiry: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'jics_sics_hq@test.com',
        password: hashedPassword,
        first_name: 'JICS',
        last_name: 'SICS HQ',
        phone: '9876543214',
        address: 'Test Address',
        aadhar_number: '123456789016',
        pan_number: 'ABCDE1234E',
        role_id: roleMap['jics_sics_hq'],
        district_id: districtId,
        is_active: true,
        is_hq: true,
        is_locked: false,
        failed_login_attempts: 0,
        last_login: null,
        reset_token: null,
        reset_token_expiry: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'jt_rcs_hq@test.com',
        password: hashedPassword,
        first_name: 'JT',
        last_name: 'RCS HQ',
        phone: '9876543215',
        address: 'Test Address',
        aadhar_number: '123456789017',
        pan_number: 'ABCDE1234F',
        role_id: roleMap['jt_rcs_hq'],
        district_id: districtId,
        is_active: true,
        is_hq: true,
        is_locked: false,
        failed_login_attempts: 0,
        last_login: null,
        reset_token: null,
        reset_token_expiry: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'jt_rcs_district@test.com',
        password: hashedPassword,
        first_name: 'JT',
        last_name: 'RCS District',
        phone: '9876543216',
        address: 'Test Address',
        aadhar_number: '123456789018',
        pan_number: 'ABCDE1234G',
        role_id: roleMap['jt_rcs_district'],
        district_id: districtId,
        is_active: true,
        is_hq: false,
        is_locked: false,
        failed_login_attempts: 0,
        last_login: null,
        reset_token: null,
        reset_token_expiry: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'rcs_district@test.com',
        password: hashedPassword,
        first_name: 'RCS',
        last_name: 'District',
        phone: '9876543217',
        address: 'Test Address',
        aadhar_number: '123456789019',
        pan_number: 'ABCDE1234H',
        role_id: roleMap['rcs_district'],
        district_id: districtId,
        is_active: true,
        is_hq: false,
        is_locked: false,
        failed_login_attempts: 0,
        last_login: null,
        reset_token: null,
        reset_token_expiry: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert users (skip if email already exists)
    for (const user of users) {
      const existingUser = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = :email`,
        {
          replacements: { email: user.email },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (existingUser.length === 0) {
        await queryInterface.bulkInsert('users', [user], {});
        console.log(`✓ Created user: ${user.email} (${user.first_name} ${user.last_name})`);
      } else {
        console.log(`⚠ User already exists: ${user.email}`);
      }
    }

    console.log(`\n✅ All workflow role users created for district: ${districtId}`);
    console.log(`📧 Default password for all users: ${defaultPassword}`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      email: [
        'applicant@test.com',
        'drcs_arcs_district@test.com',
        'jics_sics_district@test.com',
        'drcs_arcs_hq@test.com',
        'jics_sics_hq@test.com',
        'jt_rcs_hq@test.com',
        'jt_rcs_district@test.com',
        'rcs_district@test.com'
      ]
    }, {});
  }
};
