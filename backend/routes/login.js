const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("Received login request from frontend for email:", email);

  const query = 'SELECT * FROM users WHERE email = ?';

  try {
    console.log("Executing query to find user with email:", email);

    // Using async/await for better error handling
    const [results] = await db.execute(query, [email]);

    console.log("Query executed, results length:", results.length);

    if (results.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = results[0];
    console.log('User found:', user);

    const isMatch = await bcrypt.compare(password, user.password);

    console.log('Password comparison result:', isMatch);

    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('Login successful for user:', email);
    res.json({ message: 'Login successful', user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Error executing query or comparing password:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
