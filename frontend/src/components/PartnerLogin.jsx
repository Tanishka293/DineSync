import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

function PartnerLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    axios.post('http://localhost:8081/api/partner/login', credentials)
      .then(response => {
        // Store partner info in local storage for session
        localStorage.setItem('partner', JSON.stringify(response.data));
        setLoading(false);
        navigate('/partner/dashboard');
      })
      .catch(err => {
        console.error("Error logging in:", err);
        setError("Invalid Username or Password. Please try again.");
        setLoading(false);
      });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Partner Login</h2>
        <p>Welcome back! Login to manage your store.</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" value={credentials.username} onChange={handleChange} required />
          </div>
          <div className="form-group" style={{position: 'relative'}}>
            <label>Password</label>
            <input type={showPassword ? "text" : "password"} name="password" value={credentials.password} onChange={handleChange} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: '15px', top: '35px', background: 'none', border: 'none', cursor: 'pointer', color: '#747d8c', padding: 0}}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="auth-link">Not a partner yet? <span onClick={() => navigate('/partner/register')}>Register here</span></p>
        <p className="auth-link" style={{marginTop: '10px'}}><span onClick={() => navigate('/')}>Back to Home</span></p>
      </div>
    </div>
  );
}

export default PartnerLogin;
