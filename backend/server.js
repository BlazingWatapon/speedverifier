const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import the db module
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const loginRoute = require('./routes/login');
const registerRoute = require('./routes/register');
const validateRoute = require('./routes/validate');
const uploadRoute = require('./routes/upload'); 

// Use the routes
app.use('/api', loginRoute);
app.use('/api', registerRoute);
app.use('/api', validateRoute);
app.use('/api', uploadRoute);

app.get('/api/total-validations/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS count FROM single_emails WHERE users_id = ?', [userId]);
    const totalValidations = rows[0].count;
    res.json({ totalValidations });
  } catch (error) {
    console.error('Error fetching total validations:', error);
    res.status(500).send('Server error');
  }
});

app.get('/api/status-data/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT status, COUNT(*) AS count FROM single_emails WHERE users_id = ? GROUP BY status',
      [userId]
    );
    const statusOrder = ['valid', 'invalid', 'do not mail', 'unknown'];
    const statusData = statusOrder.map(status => ({
      status: status,
      count: rows.find(row => row.status === status)?.count || 0
    }));
    res.json(statusData);
  } catch (error) {
    console.error('Error fetching status data:', error);
    res.status(500).send('Server error');
  }
});

app.get('/api/history/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT idlist_emails, filename, date FROM list_emails WHERE users_id = ? ORDER BY idlist_emails DESC LIMIT 10',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).send('Server error');
  }
});

app.get('/api/download-zip/:id', async (req, res) => {
  const listId = req.params.id;
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.execute(
      'SELECT filename, valid_file, invalid_file FROM list_emails WHERE idlist_emails = ?',
      [listId]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).send('List not found');
    }

    const { filename, valid_file, invalid_file } = rows[0];

    const zipFilePath = path.join(__dirname, 'uploads', `validation_results_${listId}.zip`);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      res.download(zipFilePath, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          res.status(500).send('Error downloading file');
        } else {
          fs.unlinkSync(zipFilePath);
        }
      });
    });

    archive.pipe(output);
    archive.append(valid_file, { name: 'valid.csv' });
    archive.append(invalid_file, { name: 'invalid.csv' });
    archive.finalize();

  } catch (error) {
    console.error('Error downloading zip:', error);
    res.status(500).send('Error downloading zip');
  }
});

app.delete('/api/history/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM list_emails WHERE idlist_emails = ?', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting history:', error);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
