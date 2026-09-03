import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

function UserLogin() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  // step 1: login, 2: forgot pass email, 3: verify otp & new pass
  const [step, setStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    axios.post('http://localhost:8081/api/users/login', credentials)
      .then(response => {
        localStorage.setItem('user', JSON.stringify(response.data));
        setLoading(false);
        window.location.href = '/user/home';
      })
      .catch(err => {
        console.error("Error logging in:", err);
        setError(err.response?.data || "Invalid Email/Google ID or Password.");
        setLoading(false);
      });
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    axios.post('http://localhost:8081/api/users/forgot-password', { email: forgotEmail })
      .then(() => {
        setLoading(false);
        setStep(3);
        setSuccessMsg("OTP sent to your email!");
      })
      .catch(err => {
        setLoading(false);
        setError(err.response?.data || "Error sending OTP");
      });
  };

  const handleVerifyResetOtp = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    axios.post('http://localhost:8081/api/users/verify-reset-otp', { email: forgotEmail, otp })
      .then(() => {
        setLoading(false);
        setStep(4);
        setSuccessMsg("OTP Verified! Please enter your new password.");
      })
      .catch(err => {
        setLoading(false);
        setError(err.response?.data || "Invalid or Expired OTP");
      });
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    axios.post('http://localhost:8081/api/users/reset-password', { email: forgotEmail, otp, newPassword })
      .then(() => {
        setLoading(false);
        setSuccessMsg("Password reset successfully! You can now login.");
        setStep(1);
        setOtp('');
        setNewPassword('');
      })
      .catch(err => {
        setLoading(false);
        setError(err.response?.data || "Error resetting password");
      });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>
          {step === 1 && "User Login"}
          {step === 2 && "Forgot Password"}
          {step === 3 && "Verify OTP"}
          {step === 4 && "Reset Password"}
        </h2>
        <p>
          {step === 1 && "Login to order delicious food."}
          {step === 2 && "Enter your email to receive a reset code."}
          {step === 3 && "Enter the OTP sent to your email."}
          {step === 4 && "Enter your new password below."}
        </p>
        
        {error && <div className="error-message">{error}</div>}
        {successMsg && <div className="success-message" style={{ color: '#155724', backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{successMsg}</div>}
        
        {step === 1 && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Email (Google ID)</label>
              <input type="email" name="email" value={credentials.email} onChange={handleChange} required autoComplete="off" />
            </div>
            <div className="form-group" style={{position: 'relative'}}>
              <label>Password</label>
              <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={credentials.password} 
                  onChange={handleChange} 
                  required 
                  style={{width: '100%', paddingRight: '40px'}}
                  autoComplete="new-password"
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#a4b0be', display: 'flex', alignItems: 'center'}}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
              <div style={{textAlign: 'right', marginTop: '5px'}}>
                <span onClick={() => { setStep(2); setError(null); setSuccessMsg(null); }} style={{fontSize: '0.85rem', color: '#ff4757', cursor: 'pointer'}}>Forgot Password?</span>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleForgotSubmit}>
            <div className="form-group">
              <label>Email (Google ID)</label>
              <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required autoComplete="off" />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
            <p className="auth-link" style={{marginTop: '15px', fontSize: '0.9rem'}}><span onClick={() => setStep(1)}>Back to Login</span></p>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleVerifyResetOtp}>
            <div className="form-group">
              <label>6-Digit OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} style={{textAlign: 'center', letterSpacing: '5px'}} autoComplete="off" />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <p className="auth-link" style={{marginTop: '15px', fontSize: '0.9rem'}}><span onClick={() => setStep(1)}>Back to Login</span></p>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={handleResetSubmit}>
            <div className="form-group" style={{position: 'relative'}}>
              <label>New Password</label>
              <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  style={{width: '100%', paddingRight: '40px'}}
                  autoComplete="new-password"
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#a4b0be', display: 'flex', alignItems: 'center'}}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <p className="auth-link" style={{marginTop: '15px', fontSize: '0.9rem'}}><span onClick={() => setStep(1)}>Back to Login</span></p>
          </form>
        )}

        {step === 1 && (
          <>
            <p className="auth-link">Don't have an account? <Link to="/user/register">Register here</Link></p>
            <p className="auth-link" style={{marginTop: '10px'}}><Link to="/">Back to Home</Link></p>
          </>
        )}
      </div>
    </div>
  );
}

export default UserLogin;
