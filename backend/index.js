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
        const aesInstance = new aesAddon.AESWrapper(key, keySize, mode, iv, outputFormat);
        const encryptedText = aesInstance.encrypt(text);
        await pool.query('INSERT INTO aes_encryption (text, enc_key, key_size, mode, iv, output_format, result) VALUES (?, ?, ?, ?, ?, ?, ?)', [text, key, keySize, mode, iv, outputFormat, encryptedText]);
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
        const aesInstance = new aesAddon.AESWrapper(key, keySize, mode, iv, 'base64'); // Assume base64 for simplicity
        const decryptedText = aesInstance.decrypt(text);
        res.json({ decryptedText });
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /decrypt-aes: ${error.stack}\n`);
        console.error('Error in /decrypt-aes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/generate-rsa-keys', (req, res) => {
    try {
        const { keySize } = req.body;
        const rsaInstance = new rsaAddon.RSAWrapper();
        const keys = rsaInstance.generateKeys(keySize);
        res.json(keys);
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /generate-rsa-keys: ${error.stack}\n`);
        console.error('Error in /generate-rsa-keys:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/encrypt-rsa', async (req, res) => {
    try {
        const { text, publicKey, cipherType } = req.body;
        const rsaInstance = new rsaAddon.RSAWrapper();
        const encryptedText = rsaInstance.encrypt(publicKey, text, cipherType);
        await pool.query('INSERT INTO rsa_encryption (text, encrypted_text, public_key) VALUES (?, ?, ?)', [text, encryptedText, publicKey]);
        res.json({ encryptedText });
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /encrypt-rsa: ${error.stack}\n`);
        console.error('Error in /encrypt-rsa:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/decrypt-rsa', (req, res) => {
    try {
        const { text, privateKey, cipherType } = req.body;
        const rsaInstance = new rsaAddon.RSAWrapper();
        const decryptedText = rsaInstance.decrypt(privateKey, text, cipherType);
        res.json({ decryptedText });
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /decrypt-rsa: ${error.stack}\n`);
        console.error('Error in /decrypt-rsa:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/results/aes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT text, enc_key, key_size, mode, iv, output_format, result FROM aes_encryption');
        res.json(rows);
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /results/aes: ${error.stack}\n`);
        console.error('Error in /results/aes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/results/rsa', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT text, encrypted_text, public_key FROM rsa_encryption');
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
