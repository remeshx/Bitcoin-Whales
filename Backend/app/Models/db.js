const {Pool} = require('pg');
const dbConfig = require('../../config/database');

const db = new Pool(dbConfig);

module.exports = db;

