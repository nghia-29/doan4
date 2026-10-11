const mysql = require('mysql2');

const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'doan4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = {
  query: (sql, params, cb) => {
    let queryParams = params;
    let callback = cb;
    if (typeof queryParams === 'function') {
      callback = queryParams;
      queryParams = [];
    }

    if (typeof callback !== 'function') {
      return dbPool.query(sql, queryParams);
    }
    return dbPool.query(sql, queryParams, callback);
  },
  pool: dbPool
};

module.exports = db;
