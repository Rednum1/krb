import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import AESPage from './components/AESPage';
import RSAPage from './components/RSAPage';
import ResultsPage from './components/ResultsPage';
import './App.css'; // Імпортуємо файл стилів

function App() {
  return (
    <Router>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>

          <li>
            <Link to="/aes">AES Algorithm</Link>
          </li>
          <li>
            <Link to="/rsa">RSA Algorithm</Link>
          </li>
          <li>
            <Link to="/results">Results</Link>
          </li>
        </ul>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/aes" element={<AESPage />} />
          <Route path="/rsa" element={<RSAPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
