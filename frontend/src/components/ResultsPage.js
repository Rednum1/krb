import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ResultsPage.css';

const ResultsPage = () => {
    const [aesResults, setAesResults] = useState([]);
    const [rsaResults, setRsaResults] = useState([]);

    useEffect(() => {
        const fetchAesResults = async () => {
            try {
                const response = await axios.get('http://localhost:3001/results/aes');
                setAesResults(response.data);
            } catch (error) {
                console.error('Error fetching AES results:', error);
            }
        };

        const fetchRsaResults = async () => {
            try {
                const response = await axios.get('http://localhost:3001/results/rsa');
                setRsaResults(response.data);
            } catch (error) {
                console.error('Error fetching RSA results:', error);
            }
        };

        fetchAesResults();
        fetchRsaResults();
    }, []);

    return (
        <div className="results-page">
            <h1>Results</h1>
            <h2>AES Encryption Results</h2>
            <table className="results-table">
                <thead>
                    <tr>
                        <th>Text</th>
                        <th>Encrypted Text</th>
                        <th>Key</th>
                        <th>Key Size</th>
                        <th>Mode</th>
                        <th>IV</th>
                        <th>Output Format</th>
                        <th>Encryption Time</th>
                        <th>Memory Used</th>
                    </tr>
                </thead>
                <tbody>
                    {aesResults.map((result, index) => (
                        <tr key={index}>
                            <td>{result.user_text}</td>
                            <td>{result.result}</td>
                            <td>{result.enc_key}</td>
                            <td>{result.key_size}</td>
                            <td>{result.enc_mode}</td>
                            <td>{result.iv}</td>
                            <td>{result.output_format}</td>
                            <td>{result.encryption_time}</td>
                            <td>{result.memory_used}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h2>RSA Encryption Results</h2>
            <table className="results-table">
                <thead>
                    <tr>
                        <th>Text</th>
                        <th>Encrypted Text</th>
                        <th>Public Key</th>
                        <th>Cipher Type</th>
                        <th>Key Size</th>
                        <th>Encryption Time</th>
                        <th>Memory Used</th>
                    </tr>
                </thead>
                <tbody>
                    {rsaResults.map((result, index) => (
                        <tr key={index}>
                            <td>{result.enc_text}</td>
                            <td>{result.result}</td>
                            <td>{result.public_key}</td>
                            <td>{result.cipher_type}</td>
                            <td>{result.key_size}</td>
                            <td>{result.enc_time}</td>
                            <td>{result.memory_used}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ResultsPage;
