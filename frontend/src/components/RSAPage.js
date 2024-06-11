import React, { useState } from 'react';
import axios from 'axios';

const RSAPage = () => {
    const [rsaText, setRsaText] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [encryptedRsaText, setEncryptedRsaText] = useState('');
    const [decryptedRsaText, setDecryptedRsaText] = useState('');
    const [keySize, setKeySize] = useState(1024);
    const [cipherType, setCipherType] = useState('OAEP');

    const generateKeys = async () => {
        try {
            const response = await axios.post('http://localhost:3001/generate-rsa-keys', { keySize });
            setPublicKey(response.data.publicKey);
            setPrivateKey(response.data.privateKey);
        } catch (error) {
            console.error('Error generating RSA keys:', error);
        }
    };

    const encryptRsa = async () => {
        try {
            const response = await axios.post('http://localhost:3001/encrypt-rsa', {
                text: rsaText,
                publicKey: publicKey,
                cipherType: cipherType
            });
            setEncryptedRsaText(response.data.encryptedText);
        } catch (error) {
            console.error('Error encrypting RSA:', error);
        }
    };

    const decryptRsa = async () => {
        try {
            const response = await axios.post('http://localhost:3001/decrypt-rsa', {
                text: encryptedRsaText,
                privateKey: privateKey,
                cipherType: cipherType
            });
            setDecryptedRsaText(response.data.decryptedText);
        } catch (error) {
            console.error('Error decrypting RSA:', error);
        }
    };

    return (
        <div>
            <h1>RSA Encryption</h1>
            <div>
                <label>Key Size: </label>
                <select value={keySize} onChange={(e) => setKeySize(parseInt(e.target.value))}>
                    <option value="1024">1024</option>
                    <option value="2048">2048</option>
                    <option value="4096">4096</option>
                </select>
            </div>
            <button onClick={generateKeys}>Generate RSA Keys</button>
            <div>
                <h2>Public Key</h2>
                <textarea value={publicKey} readOnly />
            </div>
            <div>
                <h2>Private Key</h2>
                <textarea value={privateKey} readOnly />
            </div>
            <div>
                <label>Cipher Type: </label>
                <select value={cipherType} onChange={(e) => setCipherType(e.target.value)}>
                    <option value="OAEP">OAEP</option>
                    <option value="PKCS1">PKCS1</option>
                    <option value="RSA">RSA</option>
                </select>
            </div>
            <input
                type="text"
                value={rsaText}
                onChange={(e) => setRsaText(e.target.value)}
                placeholder="Enter text to encrypt"
            />
            <button onClick={encryptRsa}>Encrypt</button>
            <button onClick={decryptRsa}>Decrypt</button>
            <div>
                <h2>Encrypted Text</h2>
                <p>{encryptedRsaText}</p>
            </div>
            <div>
                <h2>Decrypted Text</h2>
                <p>{decryptedRsaText}</p>
            </div>
        </div>
    );
};

export default RSAPage;
