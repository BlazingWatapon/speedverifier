const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db'); // Import the database connection

const router = express.Router();

router.post('/register', async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password } = req.body;

  if (!firstName || !lastName || !email || !phoneNumber || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [userExists] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (userExists.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (email, password, firstname, lastname, phone_number) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName, phoneNumber]
    );

    res.status(200).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

