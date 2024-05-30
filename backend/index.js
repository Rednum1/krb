const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const aesAddon = require('./build/Release/aes');
const rsaAddon = require('./build/Release/rsa');

const app = express();
app.use(cors());
app.use(express.json());

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
    const { text, key, keySize, mode, iv, outputFormat } = req.body;
    const aesInstance = new aesAddon.AESWrapper(key, keySize, mode, iv);
    const encryptedText = aesInstance.encrypt(text);
    await pool.query(
        'INSERT INTO aes_encryption (text, enc_key, key_size, mode, iv, output_format, result) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [text, key, keySize, mode, iv, outputFormat, encryptedText]
    );
    res.json({ encryptedText });
});

app.post('/decrypt-aes', async (req, res) => {
    const { text, key, keySize, mode, iv } = req.body;
    const aesInstance = new aesAddon.AESWrapper(key, keySize, mode, iv);
    const decryptedText = aesInstance.decrypt(text);
    res.json({ decryptedText });
});

app.post('/generate-rsa-keys', (req, res) => {
    const rsaInstance = new rsaAddon.RSAWrapper();
    const keys = rsaInstance.generateKeys();
    res.json(keys);
});

app.post('/encrypt-rsa', async (req, res) => {
    const { text, publicKey } = req.body;
    const rsaInstance = new rsaAddon.RSAWrapper();
    const encryptedText = rsaInstance.encrypt(publicKey, text);
    await pool.query(
        'INSERT INTO rsa_encryption (text, encrypted_text, public_key) VALUES (?, ?, ?)', 
        [text, encryptedText, publicKey]
    );
    res.json({ encryptedText });
});

app.post('/decrypt-rsa', (req, res) => {
    const { text, privateKey } = req.body;
    const rsaInstance = new rsaAddon.RSAWrapper();
    const decryptedText = rsaInstance.decrypt(privateKey, text);
    res.json({ decryptedText });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
