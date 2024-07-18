const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const net = require('net');
const db = require('../db');
const csvParser = require('csv-parser');

async function checkEmailExist(email) {
    // Bước 1: Kiểm tra định dạng email theo chuẩn RFC 5322
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
        return { status: 'invalid', code: 550, fourthLine: 'Invalid email format' };
    }

    const [localPart, domain] = email.split('@');

    // Bước 2: Kiểm tra từ nhạy cảm trong phần tên cục bộ của email
    const spamTrapWords = ['abuse', 'spam-trap'];
    const genericWords = ['sales', 'info', 'contact'];

    const containsSpamTrapWords = spamTrapWords.some(word => localPart.includes(word));
    if (containsSpamTrapWords) {
        return { status: 'do not mail', code: 552, fourthLine: 'Spam trap address' };
    }

    const containsGenericWords = genericWords.some(word => localPart.includes(word));
    if (containsGenericWords) {
        return { status: 'do not mail', code: 552, fourthLine: 'Generic job-related address' };
    }

    return new Promise((resolve, reject) => {
        // Bước 3: Kiểm tra MX Record của domain
        dns.resolveMx(domain, (err, mxRecords) => {
            if (err) {
                console.error('Error resolving MX records:', err);
                return resolve({ status: 'invalid', code: 550, fourthLine: 'No MX records found' });
            }

            if (mxRecords.length === 0) {
                console.error('No MX records found for the domain.');
                return resolve({ status: 'invalid', code: 550, fourthLine: 'No MX records found' });
            }

            const mxServer = mxRecords[0].exchange;
            console.log('MX server:', mxServer);

            const socket = net.createConnection(25, mxServer);
            let dataBuffer = '';

            socket.on('connect', () => {
                console.log('Connected to MX server');
                socket.write(`HELO example.com\r\n`);
                socket.write(`MAIL FROM:<example@example.com>\r\n`);
                socket.write(`RCPT TO:<${email}>\r\n`);
                socket.write(`QUIT\r\n`);
            });

            socket.on('data', data => {
                dataBuffer += data.toString();
            });

            socket.on('end', () => {
                console.log('Connection closed');
                const lines = dataBuffer.split('\r\n');
                let fourthLine = '';

                // Loop to get the first non-empty line starting from the fourth line
                for (let i = 3; i >= 0; i--) {
                    if (lines[i] && lines[i].trim()) {
                        fourthLine = lines[i];
                        break;
                    }
                }

                console.log(lines);

                let status, code;
                if (fourthLine.includes('250')) {
                    status = 'valid';
                    code = 250;
                } else if (fourthLine.includes('553')) {
                    status = 'invalid';
                    code = 550;
                } else if (fourthLine.includes('552')) {
                    status = 'do not mail';
                    code = 552;
                } else if (fourthLine.includes('550')) {
                    status = 'invalid';
                    code = 550;
                } else {
                    status = 'unknown';
                    code = parseInt(fourthLine.split(' ')[0]); // Extract the code from the response
                }
                resolve({ status, code, fourthLine });
            });

            socket.on('error', error => {
                console.error('Error:', error);
                reject(error);
            });
        });
    });
}

async function insertSingleEmail(email, status, code, userId) {
    try {
        const connection = await db.getConnection();
        await connection.execute(
            `INSERT INTO single_emails (email, status, code, users_id) VALUES (?, ?, ?, ?)`,
            [email, status, code, userId]
        );
        connection.release();
    } catch (error) {
        console.error('Database error during insert into single_emails:', error);
    }
}

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    const originalFileName = req.file.originalname;
    const userId = req.body.userId;
    const selectedColumn = req.body.column;
    
    // Rút ngắn tên file thành 10 ký tự không bao gồm phần mở rộng
    const baseName = path.basename(originalFileName, path.extname(originalFileName)).substring(0, 10);
    const shortFileName = baseName + path.extname(originalFileName);

    try {
        let emails = [];

        if (req.file.originalname.endsWith('.csv') && selectedColumn) {
            const fileStream = fs.createReadStream(filePath);
            await new Promise((resolve, reject) => {
                fileStream
                    .pipe(csvParser())
                    .on('data', (row) => {
                        if (row[selectedColumn]) {
                            emails.push(row[selectedColumn].trim());
                        }
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else {
            emails = fs.readFileSync(filePath, 'utf-8').split('\n').map(email => email.trim()).filter(email => email);
        }

        const emailCount = emails.length;
        const validEmails = [];
        const invalidEmails = [];
        const statusCount = {
            "valid": 0,
            "invalid": 0,
            "do not mail": 0,
            "unknown": 0
        };

        for (const email of emails) {
            const result = await checkEmailExist(email);
            statusCount[result.status]++;
            await insertSingleEmail(email, result.status, result.code, userId);
            if (result.status === 'valid') {
                validEmails.push({ email, status: result.status, code: result.code });
            } else {
                invalidEmails.push({ email, status: result.status, code: result.code });
            }
        }

        const percentages = Object.keys(statusCount).map(status => ((statusCount[status] / emailCount) * 100).toFixed(2));
        const validCsv = validEmails.map(({ email, status, code }) => `${email},${status},${code}`).join('\n');
        const invalidCsv = invalidEmails.map(({ email, status, code }) => `${email},${status},${code}`).join('\n');

        try {
            const connection = await db.getConnection();
            await connection.execute(
                `INSERT INTO list_emails (filename, valid_file, invalid_file, users_id, date) VALUES (?, ?, ?, ?, NOW())`,
                [
                    shortFileName,
                    Buffer.from(validCsv),
                    Buffer.from(invalidCsv),
                    userId,
                ]
            );
            connection.release();
            res.json({
                emailCount,
                percentages,
            });
        } catch (dbError) {
            console.error('Database error:', dbError);
            res.status(500).json({ error: 'Database Error' });
        } finally {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Error processing the file:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        fs.unlinkSync(filePath);
    }
});

module.exports = router;
