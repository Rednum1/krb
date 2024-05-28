const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const aesAddon = require('./build/Release/aes');
const rsaAddon = require('./build/Release/rsa');

const app = express();
app.use(cors());
app.use(express.json());

const aesInstance = new aesAddon.AESWrapper('0123456789abcdef0123456789abcdef');
const rsaInstance = new rsaAddon.RSAWrapper();

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
    const { text, key } = req.body;
    const encryptedText = aesInstance.encrypt(text, key);
    await pool.query('INSERT INTO aes_encryption (text, encrypted_text) VALUES (?, ?)', [text, encryptedText]);
    res.json({ encryptedText });
});

app.post('/decrypt-aes', async (req, res) => {
    const { text, key } = req.body;
    const decryptedText = aesInstance.decrypt(text, key);
    res.json({ decryptedText });
});

app.post('/generate-rsa-keys', (req, res) => {
    const keys = rsaInstance.generateKeys();
    res.json(keys);
});

app.post('/encrypt-rsa', async (req, res) => {
    const { text, publicKey } = req.body;
    const encryptedText = rsaInstance.encrypt(publicKey, text);
    await pool.query('INSERT INTO rsa_encryption (text, encrypted_text, public_key) VALUES (?, ?, ?)', [text, encryptedText, publicKey]);
    res.json({ encryptedText });
});

app.post('/decrypt-rsa', (req, res) => {
    const { text, privateKey } = req.body;
    const decryptedText = rsaInstance.decrypt(privateKey, text);
    res.json({ decryptedText });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
