import React, { useState } from 'react';
import axios from 'axios';

const AESPage = () => {
    const [aesText, setAesText] = useState('');
    const [aesKey, setAesKey] = useState('');
    const [aesKeySize, setAesKeySize] = useState(256);
    const [aesMode, setAesMode] = useState('ECB');
    const [aesIV, setAesIV] = useState('');
    const [aesOutputFormat, setAesOutputFormat] = useState('base64');
    const [encryptedAesText, setEncryptedAesText] = useState('');
    const [decryptedAesText, setDecryptedAesText] = useState('');
    const [decryptAesKey, setDecryptAesKey] = useState('');
    const [decryptAesMode, setDecryptAesMode] = useState('ECB');
    const [decryptAesIV, setDecryptAesIV] = useState('');
    const [decryptAesText, setDecryptAesText] = useState('');
    const [error, setError] = useState('');

    const validateKey = (key) => {
        const keyLength = key.length * 8; // Convert key length to bits
        return keyLength === 128 || keyLength === 192 || keyLength === 256;
    };

    const encryptAes = async () => {
        if (!validateKey(aesKey)) {
            const keyLength = aesKey.length * 8;
            setError(`Key must be 128, 192, or 256 bits long. Currently it is ${keyLength} bits.`);
            return;
        }
        setError('');
        try {
            const response = await axios.post('http://localhost:3001/encrypt-aes', {
                text: aesText,
                key: aesKey,
                keySize: aesKeySize,
                mode: aesMode,
                iv: aesIV,
                outputFormat: aesOutputFormat
            });
            setEncryptedAesText(response.data.encryptedText);
        } catch (error) {
            console.error('Error encrypting AES:', error);
        }
    };

    const decryptAes = async () => {
        if (!validateKey(decryptAesKey)) {
            const keyLength = decryptAesKey.length * 8;
            setError(`Key must be 128, 192, or 256 bits long. Currently it is ${keyLength} bits.`);
            return;
        }
        setError('');
        try {
            const response = await axios.post('http://localhost:3001/decrypt-aes', {
                text: decryptAesText,
                key: decryptAesKey,
                keySize: aesKeySize,
                mode: decryptAesMode,
                iv: decryptAesIV
            });
            setDecryptedAesText(response.data.decryptedText);
        } catch (error) {
            console.error('Error decrypting AES:', error);
        }
    };

    return (
        <div>
            <h1>AES Encryption</h1>
            <div>
                <h2>Encrypt</h2>
                <input
                    type="text"
                    value={aesText}
                    onChange={(e) => setAesText(e.target.value)}
                    placeholder="Enter text to encrypt"
                />
                <input
                    type="text"
                    value={aesKey}
                    onChange={(e) => setAesKey(e.target.value)}
                    placeholder="Enter encryption key"
                />
                <input
                    type="number"
                    value={aesKeySize}
                    onChange={(e) => setAesKeySize(parseInt(e.target.value))}
                    placeholder="Enter key size"
                />
                <input
                    type="text"
                    value={aesMode}
                    onChange={(e) => setAesMode(e.target.value)}
                    placeholder="Enter mode (e.g., ECB, CBC)"
                />
                <input
                    type="text"
                    value={aesIV}
                    onChange={(e) => setAesIV(e.target.value)}
                    placeholder="Enter IV (if applicable)"
                />
                <input
                    type="text"
                    value={aesOutputFormat}
                    onChange={(e) => setAesOutputFormat(e.target.value)}
                    placeholder="Enter output format (e.g., base64)"
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button onClick={encryptAes}>Encrypt</button>
                <div>
                    <h2>Encrypted Text</h2>
                    <p>{encryptedAesText}</p>
                </div>
            </div>
            <div>
                <h2>Decrypt</h2>
                <input
                    type="text"
                    value={decryptAesText}
                    onChange={(e) => setDecryptAesText(e.target.value)}
                    placeholder="Enter encrypted text"
                />
                <input
                    type="text"
                    value={decryptAesKey}
                    onChange={(e) => setDecryptAesKey(e.target.value)}
                    placeholder="Enter encryption key"
                />
                <input
                    type="text"
                    value={decryptAesMode}
                    onChange={(e) => setDecryptAesMode(e.target.value)}
                    placeholder="Enter mode (e.g., ECB, CBC)"
                />
                <input
                    type="text"
                    value={decryptAesIV}
                    onChange={(e) => setDecryptAesIV(e.target.value)}
                    placeholder="Enter IV (if applicable)"
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button onClick={decryptAes}>Decrypt</button>
                <div>
                    <h2>Decrypted Text</h2>
                    <p>{decryptedAesText}</p>
                </div>
            </div>
        </div>
    );
};

export default AESPage;
