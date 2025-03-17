import React, { useState } from 'react';
import './login.css';

function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name, // Send name as 'name' to match the backend
          password,
        }),
        credentials: 'include', // Add this
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token in localStorage or state
        localStorage.setItem('token', data.token);
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (error) {
      setError('An error occurred, please try again later');
    }
  };

  return (
    <div className="login">
      <h2>Inloggning</h2>
      <input
        type="text"
        placeholder="Användarnamn"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="password"
        placeholder="Lösenord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Logga in</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Login;
