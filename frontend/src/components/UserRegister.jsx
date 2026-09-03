import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

function UserRegister() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
      setError("Please use a valid Gmail address (@gmail.com).");
      return;
    }

    setLoading(true);
    axios.post('http://localhost:8081/api/users/register', formData)
      .then(response => {
        setLoading(false);
        setStep(2);
      })
      .catch(error => {
        console.error("Error registering:", error);
        setError(error.response?.data || "Registration failed. Please try again.");
        setLoading(false);
      });
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    axios.post('http://localhost:8081/api/users/verify-otp', { email: formData.email, otp })
      .then(response => {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
          navigate('/user/login');
        }, 2000);
      })
      .catch(error => {
        console.error("Error verifying OTP:", error);
        setError(error.response?.data || "Verification failed. Please try again.");
        setLoading(false);
      });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{step === 1 ? 'Create an Account' : 'Verify Email'}</h2>
        <p>{step === 1 ? 'Join us and order from top restaurants!' : 'We sent a 6-digit code to your email.'}</p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message" style={{ color: '#155724', backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>Verification successful! Redirecting...</div>}

        {step === 1 ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email (Google ID)</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{position: 'relative'}}>
              <label>Password</label>
              <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  style={{width: '100%', paddingRight: '40px'}}
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
              {loading ? "Sending Code..." : "Next"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Enter 6-digit OTP</label>
              <input type="text" name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} style={{textAlign: 'center', letterSpacing: '5px', fontSize: '1.2rem'}} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading || success}>
              {loading ? "Verifying..." : success ? "Verified!" : "Verify Account"}
            </button>
            <p className="auth-link" style={{marginTop: '15px', fontSize: '0.9rem'}}><span onClick={() => setStep(1)}>Use a different email</span></p>
          </form>
        )}

        {step === 1 && (
          <>
            <p className="auth-link">Already have an account? <Link to="/user/login">Login here</Link></p>
            <p className="auth-link" style={{marginTop: '10px'}}><Link to="/">Back to Home</Link></p>
          </>
        )}
      </div>
    </div>
  );
}

export default UserRegister;
