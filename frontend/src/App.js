import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [aesText, setAesText] = useState('');
  const [aesKey, setAesKey] = useState('');
  const [encryptedAesText, setEncryptedAesText] = useState('');
  const [decryptedAesText, setDecryptedAesText] = useState('');

  const [rsaText, setRsaText] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [encryptedRsaText, setEncryptedRsaText] = useState('');
  const [decryptedRsaText, setDecryptedRsaText] = useState('');

  const encryptAes = async () => {
    try {
      const response = await axios.post('http://localhost:3001/encrypt-aes', { text: aesText, key: aesKey });
      setEncryptedAesText(response.data.encryptedText);
    } catch (error) {
      console.error('Error encrypting AES:', error);
    }
  };

  const decryptAes = async () => {
    try {
      const response = await axios.post('http://localhost:3001/decrypt-aes', { text: encryptedAesText, key: aesKey });
      setDecryptedAesText(response.data.decryptedText);
    } catch (error) {
      console.error('Error decrypting AES:', error);
    }
  };

  const generateRsaKeys = async () => {
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
      const response = await axios.post('http://localhost:3001/encrypt-rsa', { text: rsaText, publicKey });
      setEncryptedRsaText(response.data.encryptedText);
    } catch (error) {
      console.error('Error encrypting RSA:', error);
    }
  };

  const decryptRsa = async () => {
    try {
      const response = await axios.post('http://localhost:3001/decrypt-rsa', { text: encryptedRsaText, privateKey });
      setDecryptedRsaText(response.data.decryptedText);
    } catch (error) {
      console.error('Error decrypting RSA:', error);
    }
  };

  return (
    <div className="App">
      <h1>AES Encryption</h1>
      <input type="text" value={aesText} onChange={(e) => setAesText(e.target.value)} placeholder="Text to encrypt" />
      <input type="text" value={aesKey} onChange={(e) => setAesKey(e.target.value)} placeholder="Encryption key" />
      <button onClick={encryptAes}>Encrypt AES</button>
      <p>Encrypted Text: {encryptedAesText}</p>
      <button onClick={decryptAes}>Decrypt AES</button>
      <p>Decrypted Text: {decryptedAesText}</p>

      <h1>RSA Encryption</h1>
      <button onClick={generateRsaKeys}>Generate RSA Keys</button>
      <p>Public Key: {publicKey}</p>
      <p>Private Key: {privateKey}</p>
      <input type="text" value={rsaText} onChange={(e) => setRsaText(e.target.value)} placeholder="Text to encrypt" />
      <button onClick={encryptRsa}>Encrypt RSA</button>
      <p>Encrypted Text: {encryptedRsaText}</p>
      <button onClick={decryptRsa}>Decrypt RSA</button>
      <p>Decrypted Text: {decryptedRsaText}</p>
    </div>
  );
}

export default App;
