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

  const encryptAes = async () => {
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
    try {
      const response = await axios.post('http://localhost:3001/decrypt-aes', {
        text: encryptedAesText,
        key: aesKey,
        keySize: aesKeySize,
        mode: aesMode,
        iv: aesIV
      });
      setDecryptedAesText(response.data.decryptedText);
    } catch (error) {
      console.error('Error decrypting AES:', error);
    }
  };

  return (
    <div>
      <h1>AES Encryption</h1>
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
      <button onClick={encryptAes}>Encrypt</button>
      <button onClick={decryptAes}>Decrypt</button>
      <div>
        <h2>Encrypted Text</h2>
        <p>{encryptedAesText}</p>
      </div>
      <div>
        <h2>Decrypted Text</h2>
        <p>{decryptedAesText}</p>
      </div>
    </div>
  );
};

export default AESPage;