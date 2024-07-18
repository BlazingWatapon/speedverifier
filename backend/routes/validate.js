const express = require('express');
const router = express.Router();
const dns = require('dns');
const net = require('net');
const db = require('../db'); // Import the promise-based database connection

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
                    code = 553;
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

router.post('/validate', async (req, res) => {
    const { email, userId } = req.body;
    try {
        const result = await checkEmailExist(email);
        // Save result to database
        await db.query('INSERT INTO single_emails (email, status, code, users_id) VALUES (?, ?, ?, ?)', [email, result.status, result.code, userId]);
        // Return status, code, and fourth line to frontend
        res.json({ status: result.status, code: result.code, fourthLine: result.fourthLine });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
