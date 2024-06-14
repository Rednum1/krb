import React, { useState } from 'react';
import axios from 'axios';
import './RSAPage.css';

const RSAPage = () => {
    const [rsaText, setRsaText] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [encryptedRsaText, setEncryptedRsaText] = useState('');
    const [decryptedRsaText, setDecryptedRsaText] = useState('');
    const [keySize, setKeySize] = useState(1024);
    const [cipherType, setCipherType] = useState('OAEP');
    const [encryptionTime, setEncryptionTime] = useState('0:00');
    const [encryptionMemoryUsed, setEncryptionMemoryUsed] = useState('0');
    const [decryptionTime, setDecryptionTime] = useState('0:00');
    const [decryptionMemoryUsed, setDecryptionMemoryUsed] = useState('0');

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
                keySize: keySize,
                cipherType: cipherType
            });
            setEncryptedRsaText(response.data.encryptedText);
            setEncryptionTime(response.data.encryptionTime);
            setEncryptionMemoryUsed(response.data.memoryUsed);
        } catch (error) {
            console.error('Error encrypting RSA:', error);
        }
    };

    const decryptRsa = async () => {
        try {
            const response = await axios.post('http://localhost:3001/decrypt-rsa', {
                text: encryptedRsaText,
                privateKey: privateKey,
                keySize: keySize,
                cipherType: cipherType
            });
            setDecryptedRsaText(response.data.decryptedText);
            setDecryptionTime(response.data.decryptionTime);
            setDecryptionMemoryUsed(response.data.memoryUsed);
        } catch (error) {
            console.error('Error decrypting RSA:', error);
        }
    };

    return (
        <div className="rsa-container">
            <h1>RSA Encryption</h1>
            <div>
                <label>Key Size: </label>
                <select className="scontainer" value={keySize} onChange={(e) => setKeySize(parseInt(e.target.value))}>
                    <option value="1024">1024</option>
                    <option value="2048">2048</option>
                    <option value="4096">4096</option>
                </select>
            </div>
            <button onClick={generateKeys}>Generate RSA Keys</button>
            <div>
                <h2>Public Key</h2>
                <textarea className="container" value={publicKey} readOnly />
            </div>
            <div>
                <h2>Private Key</h2>
                <textarea className="container" value={privateKey} readOnly />
            </div>
            <div>
                <label>Cipher Type: </label>
                <select className="scontainer" value={cipherType} onChange={(e) => setCipherType(e.target.value)}>
                    <option value="OAEP">OAEP</option>
                    <option value="PKCS1">PKCS1</option>
                    <option value="RSA">RSA</option>
                </select>
            </div>
            <input className="container"
                type="text"
                value={rsaText}
                onChange={(e) => setRsaText(e.target.value)}
                placeholder="Enter text to encrypt"
            />
            <p><button onClick={encryptRsa}>Encrypt</button></p>
            <div>
                <h2>Encrypted Text</h2>
                <p>{encryptedRsaText}</p>
                <p>Encryption Time: {encryptionTime} seconds</p>
                <p>Memory Used: {encryptionMemoryUsed} MB</p>
            </div>
            <div>
                <h2>Decrypt</h2>
                <div>
                <label>Cipher Type: </label>
                <select className="scontainer" value={cipherType} onChange={(e) => setCipherType(e.target.value)}>
                    <option value="OAEP">OAEP</option>
                    <option value="PKCS1">PKCS1</option>
                    <option value="RSA">RSA</option>
                </select>
            </div>
                <textarea className="container"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Enter private key"
                />
                <textarea className="container"
                    value={encryptedRsaText}
                    onChange={(e) => setEncryptedRsaText(e.target.value)}
                    placeholder="Enter encrypted text"
                />
               <p> <button onClick={decryptRsa}>Decrypt</button></p>
            </div>
            <div>
                <h2>Decrypted Text</h2>
                <p>{decryptedRsaText}</p>
                <p>Decryption Time: {decryptionTime} seconds</p>
                <p>Memory Used: {decryptionMemoryUsed} MB</p>
            </div>
        </div>
    );
};

export default RSAPage;
