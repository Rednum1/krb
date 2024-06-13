const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const fs = require('fs');
const aesAddon = require('./build/Release/aes');
const rsaAddon = require('./build/Release/rsa');
const { performance } = require('perf_hooks');

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

// AES Encryption Endpoint
app.post('/encrypt-aes', async (req, res) => {
    try {
        const { text, key, keySize, mode, iv, outputFormat } = req.body;
        const aesInstance = new aesAddon.AESWrapper(key, mode, iv);

        const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        const startTime = performance.now();

        const encryptedText = aesInstance.encrypt(text);

        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

        const encryptionTime = (endTime - startTime) / 1000;
        const memoryUsed = endMemory - startMemory;

        await pool.query('INSERT INTO aes_enc (user_text, enc_key, key_size, enc_mode, iv, output_format, result, encryption_time, memory_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [text, key, keySize, mode, iv, outputFormat, encryptedText, encryptionTime, memoryUsed]);

        res.json({ encryptedText, encryptionTime, memoryUsed });
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /encrypt-aes: ${error.stack}\n`);
        console.error('Error in /encrypt-aes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// AES Decryption Endpoint
app.post('/decrypt-aes', async (req, res) => {
    try {
        const { text, key, keySize, mode, iv } = req.body;
        const aesInstance = new aesAddon.AESWrapper(key, mode, iv);

        const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        const startTime = performance.now();

        const decryptedText = aesInstance.decrypt(text);

        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

        const decryptionTime = (endTime - startTime) / 1000;
        const memoryUsed = endMemory - startMemory;

        await pool.query('INSERT INTO aes_dec (enc_text, enc_key, key_size, dec_mode, iv, output_format, result, dec_time, memory_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [text, key, keySize, mode, iv, 'base64', decryptedText, decryptionTime, memoryUsed]);

        res.json({ decryptedText, decryptionTime, memoryUsed });
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /decrypt-aes: ${error.stack}\n`);
        console.error('Error in /decrypt-aes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// RSA Key Generation Endpoint
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

// RSA Encryption Endpoint
app.post('/encrypt-rsa', async (req, res) => {
    try {
        const { text, publicKey, keySize, cipherType } = req.body;
        const rsaInstance = new rsaAddon.RSAWrapper();

        const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        const startTime = performance.now();

        const encryptedText = rsaInstance.encrypt(publicKey, text, cipherType);

        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

        const encryptionTime = (endTime - startTime) / 1000;
        const memoryUsed = endMemory - startMemory;

        await pool.query('INSERT INTO rsa_enc (enc_text, public_key, cipher_type, private_key, key_size, enc_time, memory_used) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [text, publicKey, cipherType, null, keySize, encryptionTime, memoryUsed]);

        res.json({ encryptedText, encryptionTime, memoryUsed });
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /encrypt-rsa: ${error.stack}\n`);
        console.error('Error in /encrypt-rsa:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// RSA Decryption Endpoint
app.post('/decrypt-rsa', async (req, res) => {
    try {
        const { text, privateKey, keySize, cipherType } = req.body;
        const rsaInstance = new rsaAddon.RSAWrapper();

        const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        const startTime = performance.now();

        const decryptedText = rsaInstance.decrypt(privateKey, text, cipherType);

        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

        const decryptionTime = (endTime - startTime) / 1000;
        const memoryUsed = endMemory - startMemory;

        await pool.query('INSERT INTO rsa_dec (encrypted_text, private_key, result, cipher_type, key_size, decryption_time, memory_used) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [text, privateKey, decryptedText, cipherType, keySize, decryptionTime, memoryUsed]);

        res.json({ decryptedText, decryptionTime, memoryUsed });
    } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in /decrypt-rsa: ${error.stack}\n`);
        console.error('Error in /decrypt-rsa:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get AES Results Endpoint
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

// Get RSA Results Endpoint
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
