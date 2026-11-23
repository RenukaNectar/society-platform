require('dotenv').config();
'use strict';

var config = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Nect@rRCS01',
    database: process.env.DB_NAME || 'society',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql'
  },
  test: {
    username: 'root',
    password: '',
    database: 'test_db',
    host: '127.0.0.1',
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Nect@rRCS01',
    database: process.env.DB_NAME || 'society',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql'
  }
};

module.exports = config;
