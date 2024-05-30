import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
        <div>
            <h1>Results</h1>
            <h2>AES Encryption Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Text</th>
                        <th>Encrypted Text</th>
                        <th>Key</th>
                        <th>Key Size</th>
                        <th>Mode</th>
                        <th>IV</th>
                        <th>Output Format</th>
                    </tr>
                </thead>
                <tbody>
                    {aesResults.map((result, index) => (
                        <tr key={index}>
                            <td>{result.text}</td>
                            <td>{result.result}</td>
                            <td>{result.enc_key}</td>
                            <td>{result.key_size}</td>
                            <td>{result.mode}</td>
                            <td>{result.iv}</td>
                            <td>{result.output_format}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h2>RSA Encryption Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Text</th>
                        <th>Encrypted Text</th>
                        <th>Public Key</th>
                    </tr>
                </thead>
                <tbody>
                    {rsaResults.map((result, index) => (
                        <tr key={index}>
                            <td>{result.text}</td>
                            <td>{result.encrypted_text}</td>
                            <td>{result.public_key}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ResultsPage;
