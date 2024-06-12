const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const fs = require('fs');
const aesAddon = require('./build/Release/aes');
const rsaAddon = require('./build/Release/rsa');

const app = express();
app.use(cors());
app.use(express.json());

const logStream = fs.createWriteStream('server.log', { flags: 'a' });

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1111',
    database: 'encryption_db'
});

app.get('/', (req, res) => {
    res.send('Welcome to the AES and RSA Encryption Server');
});

app.post('/encrypt-aes', async (req, res) => {
    try {
        const { text, key, keySize, mode, iv, outputFormat } = req.body;
        const aesInstance = new aesAddon.AESWrapper(key, mode, iv);
        const start = process.hrtime();
        const encryptedText = aesInstance.encrypt(text);
        const end = process.hrtime(start);

        const encryptionTime = end[0] + end[1] / 1e9; // час у секундах
        const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024; // пам'ять у мегабайтах

        await pool.query(
            'INSERT INTO aes_enc (user_text, enc_key, key_size, enc_mode, iv, output_format, result, encryption_time, memory_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [text, key, keySize, mode, iv, outputFormat, encryptedText, encryptionTime, memoryUsed]
        );
        res.json({ encryptedText });
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /encrypt-aes: ${error.stack}\n`);
        console.error('Error in /encrypt-aes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/decrypt-aes', async (req, res) => {
    try {
        const { text, key, keySize, mode, iv } = req.body;
        const aesInstance = new aesAddon.AESWrapper(key, mode, iv);
        const start = process.hrtime();
        const decryptedText = aesInstance.decrypt(text);
        const end = process.hrtime(start);

        const decryptionTime = end[0] + end[1] / 1e9; // час у секундах
        const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024; // пам'ять у мегабайтах

        await pool.query(
            'INSERT INTO aes_dec (enc_text, enc_key, key_size, dec_mode, iv, output_format, result, dec_time, memory_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [text, key, keySize, mode, iv, 'base64', decryptedText, decryptionTime, memoryUsed]
        );
        res.json({ decryptedText });
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /decrypt-aes: ${error.stack}\n`);
        console.error('Error in /decrypt-aes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/generate-rsa-keys', (req, res) => {
    try {
        const rsaInstance = new rsaAddon.RSAWrapper();
        const keys = rsaInstance.generateKeys();
        res.json(keys);
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /generate-rsa-keys: ${error.stack}\n`);
        console.error('Error in /generate-rsa-keys:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/encrypt-rsa', async (req, res) => {
    try {
        const { text, publicKey } = req.body;
        const rsaInstance = new rsaAddon.RSAWrapper();
        const start = process.hrtime();
        const encryptedText = rsaInstance.encrypt(publicKey, text);
        const end = process.hrtime(start);

        const encryptionTime = end[0] + end[1] / 1e9; // час у секундах
        const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024; // пам'ять у мегабайтах

        await pool.query(
            'INSERT INTO rsa_enc (enc_text, public_key, private_key, key_size, enc_time, memory_used) VALUES (?, ?, ?, ?, ?, ?)',
            [text, encryptedText, publicKey, 2048, encryptionTime, memoryUsed]
        );
        res.json({ encryptedText });
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /encrypt-rsa: ${error.stack}\n`);
        console.error('Error in /encrypt-rsa:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/decrypt-rsa', async (req, res) => {
    try {
        const { text, privateKey } = req.body;
        const rsaInstance = new rsaAddon.RSAWrapper();
        const start = process.hrtime();
        const decryptedText = rsaInstance.decrypt(privateKey, text);
        const end = process.hrtime(start);

        const decryptionTime = end[0] + end[1] / 1e9; // час у секундах
        const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024; // пам'ять у мегабайтах

        await pool.query(
            'INSERT INTO rsa_dec (encrypted_text, private_key, result, key_size, decryption_time, memory_used) VALUES (?, ?, ?, ?, ?, ?)',
            [text, privateKey, decryptedText, 2048, decryptionTime, memoryUsed]
        );
        res.json({ decryptedText });
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /decrypt-rsa: ${error.stack}\n`);
        console.error('Error in /decrypt-rsa:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/results/aes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM aes_enc');
        res.json(rows);
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /results/aes: ${error.stack}\n`);
        console.error('Error in /results/aes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/results/rsa', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rsa_enc');
        res.json(rows);
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /results/rsa: ${error.stack}\n`);
        console.error('Error in /results/rsa:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
    logStream.write(`[${new Date().toISOString()}] Uncaught Exception: ${err.stack}\n`);
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    logStream.write(`[${new Date().toISOString()}] Unhandled Rejection at: ${promise}, reason: ${reason.stack || reason}\n`);
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
