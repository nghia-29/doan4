const mysql = require('mysql2');

let dbPool = null;
try {
  dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'doan4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
} catch (e) {
  console.warn('[AI Studio] MySQL initialization warning:', e.message);
}

const safeDb = {
  query: (sql, params, cb) => {
    let callback = cb;
    let queryParams = params;
    if (typeof queryParams === 'function') {
      callback = queryParams;
      queryParams = [];
    }

    if (dbPool) {
      dbPool.query(sql, queryParams, (err, results, fields) => {
        if (err) {
          console.warn('[AI Studio] MySQL offline warning, returning empty rows:', err.code || err.message);
          return callback ? callback(null, [], []) : null;
        }
        return callback ? callback(null, results, fields) : null;
      });
    } else {
      return callback ? callback(null, [], []) : null;
    }
  }
};

module.exports = safeDb;
