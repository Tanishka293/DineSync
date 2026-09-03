import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

function AdminLogin() {
  const [credentials, setCredentials] = useState({ adminId: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (credentials.adminId === 'admin' && credentials.password === 'admin') {
      localStorage.setItem('admin', JSON.stringify({ role: 'admin' }));
      window.location.href = '/admin/dashboard';
    } else {
      setError('Invalid Admin Credentials');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Admin Portal</h2>
        <p>Login to DineSync headquarters.</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Admin ID</label>
            <input type="text" value={credentials.adminId} onChange={e => setCredentials({...credentials, adminId: e.target.value})} required />
          </div>
          <div className="form-group" style={{position: 'relative'}}>
            <label>Password</label>
            <input type={showPassword ? "text" : "password"} value={credentials.password} onChange={e => setCredentials({...credentials, password: e.target.value})} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: '10px', top: '35px', background: 'none', border: 'none', cursor: 'pointer', color: '#747d8c', padding: 0}}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" className="btn-primary">Login to Headquarters</button>
        </form>
        <p className="auth-link" style={{marginTop: '15px'}}><Link to="/">Return to Home</Link></p>
      </div>
    </div>
  );
}

export default AdminLogin;
