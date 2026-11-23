'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = :email LIMIT 1`,
      { replacements: { email: 'admin@society.com' }, type: Sequelize.QueryTypes.SELECT }
    );
    if (existing && existing.length > 0) return;

    const [adminRole] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = :name LIMIT 1`,
      { replacements: { name: 'admin' }, type: Sequelize.QueryTypes.SELECT }
    );
    if (!adminRole?.id) {
      throw new Error('Admin role not found (roles.name="admin"). Run roles seeder first.');
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await queryInterface.bulkInsert('users', [
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        email: 'admin@society.com',
        password: hashedPassword,
        first_name: 'System',
        last_name: 'Administrator',
        phone: '9874563210',
        address: 'System Address',
        aadhar_number: '123456789012',
        pan_number: 'ABCDE1234F',
        role_id: adminRole.id,
        is_active: true,
        is_locked: false,
        failed_login_attempts: 0,
        last_login: null,
        reset_token: null,
        reset_token_expiry: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { email: 'admin@society.com' }, {});
  }
}; 