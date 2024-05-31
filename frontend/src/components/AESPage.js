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
    const [copyMessage, setCopyMessage] = useState('');

    const validateKey = (key) => {
        const keyLength = key.length * 4; // Convert key length to bits
        return keyLength === 128 || keyLength === 192 || keyLength === 256;
    };

    const generateKey = () => {
        const keyLength = aesKeySize / 8; // Calculate the number of bytes needed
        const generatedKey = Array.from(crypto.getRandomValues(new Uint8Array(keyLength)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        setAesKey(generatedKey);
    };

    const encryptAes = async () => {
        if (!validateKey(aesKey)) {
            const keyLength = aesKey.length * 4; // Convert key length to bits
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
            const keyLength = decryptAesKey.length * 4; // Convert key length to bits
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

    const copyToClipboard = async (text) => {
        await navigator.clipboard.writeText(text);
        setCopyMessage('Text copied to clipboard');
        setTimeout(() => {
            setCopyMessage('');
        }, 2000);
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
                <select value={aesKeySize} onChange={(e) => setAesKeySize(parseInt(e.target.value))}>
                    <option value={128}>128</option>
                    <option value={192}>192</option>
                    <option value={256}>256</option>
                </select>
                <button onClick={generateKey}>Generate Key</button>
                <select value={aesMode} onChange={(e) => setAesMode(e.target.value)}>
                    <option value="ECB">ECB</option>
                    <option value="CBC">CBC</option>
                    <option value="CFB">CFB</option>
                </select>
                <input
                    type="text"
                    value={aesIV}
                    onChange={(e) => setAesIV(e.target.value)}
                    placeholder="Enter IV (if applicable)"
                />
                <div>
                    <label>
                        <input
                            type="radio"
                            value="base64"
                            checked={aesOutputFormat === 'base64'}
                            onChange={(e) => setAesOutputFormat(e.target.value)}
                        />
                        Base64
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="hex"
                            checked={aesOutputFormat === 'hex'}
                            onChange={(e) => setAesOutputFormat(e.target.value)}
                        />
                        Hex
                    </label>
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button onClick={encryptAes}>Encrypt</button>
                <button onClick={() => copyToClipboard(encryptedAesText)}>Copy Encrypted Text</button>
                <div>
                    <h2>Encrypted Text</h2>
                    <p>{encryptedAesText}</p>
                </div>
                {copyMessage && <p>{copyMessage}</p>}
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
                <select value={decryptAesMode} onChange={(e) => setDecryptAesMode(e.target.value)}>
                    <option value="ECB">ECB</option>
                    <option value="CBC">CBC</option>
                    <option value="CFB">CFB</option>
                </select>
                <input
                    type="text"
                    value={decryptAesIV}
                    onChange={(e) => setDecryptAesIV(e.target.value)}
                    placeholder="Enter IV (if applicable)"
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button onClick={decryptAes}>Decrypt</button>
                <button onClick={() => copyToClipboard(decryptedAesText)}>Copy Decrypted Text</button>
                <div>
                    <h2>Decrypted Text</h2>
                    <p>{decryptedAesText}</p>
                </div>
                {copyMessage && <p>{copyMessage}</p>}
            </div>
        </div>
    );
};

export default AESPage;
