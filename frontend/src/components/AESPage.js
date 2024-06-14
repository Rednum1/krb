import React, { useState } from 'react';
import axios from 'axios';
import './AESPage.css';

const AESPage = () => {
    const [aesText, setAesText] = useState('');
    const [aesKey, setAesKey] = useState('');
    const [aesKeySize, setAesKeySize] = useState(128);
    const [aesMode, setAesMode] = useState('CBC');
    const [aesIV, setAesIV] = useState('');
    const [aesOutputFormat, setAesOutputFormat] = useState('base64');
    const [encryptedAesText, setEncryptedAesText] = useState('');
    const [encryptionTime, setEncryptionTime] = useState('0:00');
    const [encryptionMemoryUsed, setEncryptionMemoryUsed] = useState('0');
    const [decryptedAesText, setDecryptedAesText] = useState('');
    const [decryptionTime, setDecryptionTime] = useState('0:00');
    const [decryptionMemoryUsed, setDecryptionMemoryUsed] = useState('0');
    const [decryptAesKey, setDecryptAesKey] = useState('');
    const [decryptAesKeySize, setDecryptAesKeySize] = useState(128);
    const [decryptAesMode, setDecryptAesMode] = useState('CBC');
    const [decryptAesIV, setDecryptAesIV] = useState('');
    const [decryptAesText, setDecryptAesText] = useState('');
    const [error, setError] = useState('');
    const [copyMessage, setCopyMessage] = useState('');

    const validateKey = (key, keySize) => {
        const keyLength = key.length * 4; // Convert key length to bits
        return keyLength === keySize;
    };

    const generateKey = () => {
        const keyLength = aesKeySize / 8; // Calculate the number of bytes needed
        const generatedKey = Array.from(crypto.getRandomValues(new Uint8Array(keyLength)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        setAesKey(generatedKey);
    };

    const encryptAes = async () => {
        if (!validateKey(aesKey, aesKeySize)) {
            const keyLength = aesKey.length * 4; // Convert key length to bits
            setError(`Key must be ${aesKeySize} bits long. Currently it is ${keyLength} bits.`);
            return;
        }
        if ((aesMode === 'CBC' || aesMode === 'CFB') && aesIV.length !== 32) {
            const missingBytes = 16 - aesIV.length / 2;
            setError(`IV must be 16 bytes long for CBC and CFB modes. Missing ${missingBytes} bytes.`);
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
            setEncryptionTime(response.data.encryptionTime);
            setEncryptionMemoryUsed(response.data.memoryUsed);
        } catch (error) {
            console.error('Error encrypting AES:', error);
        }
    };

    const decryptAes = async () => {
        if (!validateKey(decryptAesKey, decryptAesKeySize)) {
            const keyLength = decryptAesKey.length * 4; // Convert key length to bits
            setError(`Key must be ${decryptAesKeySize} bits long. Currently it is ${keyLength} bits.`);
            return;
        }
        if ((decryptAesMode === 'CBC' || decryptAesMode === 'CFB') && decryptAesIV.length !== 32) {
            const missingBytes = 16 - decryptAesIV.length / 2;
            setError(`IV must be 16 bytes long for CBC and CFB modes. Missing ${missingBytes} bytes.`);
            return;
        }
        setError('');
        try {
            const response = await axios.post('http://localhost:3001/decrypt-aes', {
                text: decryptAesText,
                key: decryptAesKey,
                keySize: decryptAesKeySize,
                mode: decryptAesMode,
                iv: decryptAesIV
            });
            setDecryptedAesText(response.data.decryptedText);
            setDecryptionTime(response.data.decryptionTime);
            setDecryptionMemoryUsed(response.data.memoryUsed);
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
        <div className="aes-container">
            <h1>AES Encryption</h1>
            <div className="section">
                <h2>Encrypt</h2>
                <textarea
                    className="textarea"
                    value={aesText}
                    onChange={(e) => setAesText(e.target.value)}
                    placeholder="Enter text to encrypt"
                />
                <div className="input-group">
                    <input className="container"
                        type="text"
                        value={aesKey}
                        onChange={(e) => setAesKey(e.target.value)}
                        placeholder="Enter encryption key"
                    />
                    <select className="scontainer" value={aesKeySize} onChange={(e) => setAesKeySize(parseInt(e.target.value))}>
                        <option value={128}>128</option>
                        <option value={192}>192</option>
                        <option value={256}>256</option>
                    </select>
                    <button onClick={generateKey}>Generate Key</button>
                </div>
                <div className="input-group">
                    {(aesMode === 'CBC' || aesMode === 'CFB') && (
                        <input className="container"
                            type="text"
                            value={aesIV}
                            onChange={(e) => setAesIV(e.target.value)}
                            placeholder="Enter IV (32 hex characters)"
                        />
                    )}
                    <select className="scontainer" value={aesMode} onChange={(e) => setAesMode(e.target.value)}>
                        <option value="ECB">ECB</option>
                        <option value="CBC">CBC</option>
                        <option value="CFB">CFB</option>
                    </select>
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
                </div>
                {error && <p className="error">{error}</p>}
                <div className="button-group">
                    <button onClick={encryptAes}>Encrypt</button>
                    <button onClick={() => copyToClipboard(encryptedAesText)}>Copy Encrypted Text</button>
                </div>
                <div className="result-section">
                    <h2>Encrypted Text</h2>
                    <textarea
                        className="textarea"
                        value={encryptedAesText}
                        readOnly
                    />
                    <p>Encryption Time: {encryptionTime !== null ? `${encryptionTime} seconds` : ''}</p>
                    <p>Memory Used: {encryptionMemoryUsed !== null ? `${encryptionMemoryUsed} MB` : ''}</p>
                </div>
                {copyMessage && <p>{copyMessage}</p>}
            </div>
            <div className="section">
                <h2>Decrypt</h2>
                <textarea
                    className="textarea"
                    value={decryptAesText}
                    onChange={(e) => setDecryptAesText(e.target.value)}
                    placeholder="Enter encrypted text"
                />
                <div className="input-group">
                    <input className="container"
                        type="text"
                        value={decryptAesKey}
                        onChange={(e) => setDecryptAesKey(e.target.value)}
                        placeholder="Enter decryption key"
                    />
                    <select className="scontainer" value={decryptAesKeySize} onChange={(e) => setDecryptAesKeySize(parseInt(e.target.value))}>
                        <option value={128}>128</option>
                        <option value={192}>192</option>
                        <option value={256}>256</option>
                    </select>
                </div>
                <div className="input-group">
                    {(decryptAesMode === 'CBC' || decryptAesMode === 'CFB') && (
                        <input className="container"
                            type="text"
                            value={decryptAesIV}
                            onChange={(e) => setDecryptAesIV(e.target.value)}
                            placeholder="Enter IV (32 hex characters)"
                        />
                    )}
                    <select className="scontainer" value={decryptAesMode} onChange={(e) => setDecryptAesMode(e.target.value)}>
                        <option value="ECB">ECB</option>
                        <option value="CBC">CBC</option>
                        <option value="CFB">CFB</option>
                    </select>
                </div>
                {error && <p className="error">{error}</p>}
                <div className="button-group">
                    <button onClick={decryptAes}>Decrypt</button>
                    <button onClick={() => copyToClipboard(decryptedAesText)}>Copy Decrypted Text</button>
                </div>
                <div className="result-section">
                    <h2>Decrypted Text</h2>
                    <textarea
                        className="textarea"
                        value={decryptedAesText}
                        readOnly
                    />
                    <p>Decryption Time: {decryptionTime !== null ? `${decryptionTime} seconds` : ''}</p>
                    <p>Memory Used: {decryptionMemoryUsed !== null ? `${decryptionMemoryUsed} MB` : ''}</p>
                </div>
                {copyMessage && <p>{copyMessage}</p>}
            </div>
        </div>
    );
};

export default AESPage;
