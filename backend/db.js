const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost', // Replace with your MySQL server host
  user: 'root',
  password: 'huyhuy123',
  database: 'speed_verifier',
  port: 3306 // Replace with your MySQL server port if different
});

db.getConnection()
  .then(connection => {
    console.log('Connected to the database');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err.message);
  });

module.exports = db;
