import React, { useState } from 'react';
import axios from 'axios';

const RSAPage = () => {
    const [rsaText, setRsaText] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [encryptedRsaText, setEncryptedRsaText] = useState('');
    const [decryptedRsaText, setDecryptedRsaText] = useState('');

    const generateKeys = async () => {
        try {
            const response = await axios.post('http://localhost:3001/generate-rsa-keys');
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
                publicKey: publicKey
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
                privateKey: privateKey
            });
            setDecryptedRsaText(response.data.decryptedText);
        } catch (error) {
            console.error('Error decrypting RSA:', error);
        }
    };

    return (
        <div>
            <h1>RSA Encryption</h1>
            <button onClick={generateKeys}>Generate RSA Keys</button>
            <div>
                <h2>Public Key</h2>
                <textarea value={publicKey} readOnly />
            </div>
            <div>
                <h2>Private Key</h2>
                <textarea value={privateKey} readOnly />
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
