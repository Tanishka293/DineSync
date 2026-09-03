import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle, FileText, AlertCircle, Info } from 'lucide-react';

function PartnerRegister() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    ownerName: '',
    name: '', // Restaurant Name
    contactNumber: '',
    location: '',
    fssaiLicense: '',
    gstNumber: '',
    bankDetails: '',
    ownerIdProof: ''
  });
  const [files, setFiles] = useState({
    fssaiLicenseFile: null,
    gstNumberFile: null,
    ownerIdProofFile: null,
    bankDetailsFile: null
  });
  const [successMsg, setSuccessMsg] = useState(false);
  const [dialog, setDialog] = useState(null); // { title: '', message: '', type: 'error' | 'warning', onConfirm: fn }
  const navigate = useNavigate();

  const handleFileChange = (e, fileKey) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [fileKey]: e.target.files[0] });
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email) {
      setDialog({ title: 'Missing Email', message: 'Please enter your email address.', type: 'warning', onConfirm: () => setDialog(null) });
      return;
    }
    setLoading(true);
    axios.post('http://localhost:8081/api/partner/send-otp', { email })
      .then(() => {
        setStep(2);
        setLoading(false);
      })
      .catch(err => {
        setDialog({ title: 'Error', message: err.response?.data || "Error sending OTP", type: 'error', onConfirm: () => setDialog(null) });
        setLoading(false);
      });
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp) {
      setDialog({ title: 'Missing OTP', message: 'Please enter the verification code.', type: 'warning', onConfirm: () => setDialog(null) });
      return;
    }
    setLoading(true);
    axios.post('http://localhost:8081/api/partner/verify-otp', { email, otp })
      .then(() => {
        setStep(3);
        setLoading(false);
      })
      .catch(err => {
        setDialog({ title: 'Verification Failed', message: err.response?.data || "Invalid OTP", type: 'error', onConfirm: () => setDialog(null) });
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBasicDetailsSubmit = (e) => {
    e.preventDefault();
    setStep(4);
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    
    // Explicit manual validation because visually hidden file inputs bypass HTML5 required flags
    if (!files.fssaiLicenseFile || !files.gstNumberFile || !files.ownerIdProofFile || !files.bankDetailsFile) {
      setDialog({ title: 'Validation Error', message: 'Please upload all 4 required document files before submitting!', type: 'warning', onConfirm: () => setDialog(null) });
      return;
    }

    setLoading(true);
    
    try {
      const fssaiLicenseFileBase64 = await fileToBase64(files.fssaiLicenseFile);
      const gstNumberFileBase64 = await fileToBase64(files.gstNumberFile);
      const ownerIdProofFileBase64 = await fileToBase64(files.ownerIdProofFile);
      const bankDetailsFileBase64 = await fileToBase64(files.bankDetailsFile);

      const payload = {
        ...formData,
        email,
        fssaiLicenseFile: fssaiLicenseFileBase64,
        gstNumberFile: gstNumberFileBase64,
        ownerIdProofFile: ownerIdProofFileBase64,
        bankDetailsFile: bankDetailsFileBase64
      };

      const response = await axios.post('http://localhost:8081/api/partner/register', payload);
      setSuccessMsg(true);
      setLoading(false);
    } catch (error) {
      setDialog({ title: 'Error', message: error.response?.data || "Error submitting application", type: 'error', onConfirm: () => setDialog(null) });
      setLoading(false);
    }
  };

  if (successMsg) {
    return (
      <div className="auth-container">
        <div className="auth-card success-card" style={{maxWidth: '500px'}}>
          <h2 style={{color: '#2ed573'}}>Application Submitted! 🎉</h2>
          <p>Thank you for partnering with DineSync, {formData.ownerName}.</p>
          <div className="credentials-box" style={{backgroundColor: '#f1f2f6', padding: '20px', borderRadius: '8px', textAlign: 'left', marginTop: '20px', border: '1px solid #dcdde1'}}>
            <p style={{margin: '0 0 15px 0', color: '#2f3542', fontSize: '15px', lineHeight: '1.5'}}>Your application has been sent to our Admin team for verification.</p>
            <p style={{margin: '0 0 15px 0', color: '#2f3542', fontSize: '15px', lineHeight: '1.5'}}>Once your documents are verified and your account is approved, you will receive an email with your unique <strong>Username</strong> and <strong>Password</strong> to access the Partner Dashboard.</p>
            <p style={{margin: '0', color: '#ff4757', fontSize: '16px'}}><strong>Status:</strong> PENDING APPROVAL</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/')} style={{marginTop: '20px'}}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      {/* Custom Dialog Overlay */}
      {dialog && (
        <div className="custom-modal-overlay" style={{zIndex: 9999}}>
          <div className="custom-modal-content" style={{maxWidth: '400px', padding: '30px', textAlign: 'center'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: '15px'}}>
              {dialog.type === 'error' ? <AlertCircle size={40} color="#ff4757" /> : <Info size={40} color="#ffa502" />}
            </div>
            <h3 style={{fontSize: '22px', marginBottom: '10px'}}>{dialog.title}</h3>
            <p style={{color: '#747d8c', marginBottom: '20px', lineHeight: '1.5'}}>{dialog.message}</p>
            <div className="modal-actions" style={{display: 'flex', justifyContent: 'center'}}>
              <button className="btn-primary" style={{backgroundColor: dialog.type === 'error' ? '#ff4757' : '#ffa502', padding: '10px 30px'}} onClick={dialog.onConfirm}>
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="auth-card" style={{maxWidth: '850px', padding: '40px'}}>
        <h2>Partner with DineSync</h2>
        
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px', position: 'relative'}}>
           <div style={{position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', background: '#edf2f7', zIndex: '0'}}></div>
           {[1, 2, 3, 4].map(s => (
             <div key={s} style={{
               width: '30px', height: '30px', borderRadius: '50%', 
               background: step >= s ? '#ff4757' : '#edf2f7', 
               color: step >= s ? 'white' : '#747d8c',
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               fontWeight: 'bold', zIndex: '1', border: '3px solid white'
             }}>
               {s}
             </div>
           ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <p>Step 1: Enter your business email</p>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="restaurant@example.com" />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p>Step 2: Verify your email</p>
            <div className="form-group">
              <label>6-Digit Verification Code</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="123456" maxLength="6" />
              <small style={{display: 'block', marginTop: '5px', color: '#747d8c'}}>Sent to {email}</small>
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              <button type="button" className="btn-secondary" onClick={() => setStep(1)} style={{flex: 1}}>Back</button>
              <button type="submit" className="btn-primary" disabled={loading} style={{flex: 2}}>
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleBasicDetailsSubmit} className="grid-form">
            <p style={{gridColumn: '1 / -1'}}>Step 3: Basic Details</p>
            <div className="form-group">
              <label>Owner Full Name</label>
              <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Restaurant/Shop Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Contact Number</label>
              <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Location (City, Area)</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn-primary" style={{gridColumn: '1 / -1'}}>Next: Documents</button>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={handleFinalSubmit} className="grid-form">
            <p style={{gridColumn: '1 / -1'}}>Step 4: Legal & Documents</p>
            
            <div className="form-group" style={{gridColumn: '1 / -1', display: 'flex', gap: '20px', alignItems: 'flex-start'}}>
              <div style={{flex: 1}}>
                <label>FSSAI License Number</label>
                <input type="text" name="fssaiLicense" value={formData.fssaiLicense} onChange={handleChange} required placeholder="14-digit FSSAI number" />
              </div>
              <div style={{flex: 1}}>
                <label>Upload FSSAI Certificate</label>
                <div style={{
                  position: 'relative', border: '2px dashed #dcdde1', borderRadius: '8px', 
                  padding: '15px', textAlign: 'center', cursor: 'pointer', backgroundColor: files.fssaiLicenseFile ? '#f1fcf5' : '#f8f9fa',
                  transition: 'all 0.3s ease'
                }} onClick={() => document.getElementById('fssai-upload').click()}>
                  {files.fssaiLicenseFile ? (
                    <div style={{color: '#2ed573', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                      <CheckCircle size={24} style={{marginBottom: '5px'}} />
                      <span style={{fontSize: '12px', fontWeight: 'bold'}}>{files.fssaiLicenseFile.name}</span>
                    </div>
                  ) : (
                    <div style={{color: '#747d8c', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                      <UploadCloud size={24} style={{marginBottom: '5px', color: '#ff4757'}} />
                      <span style={{fontSize: '13px'}}>Click to browse files</span>
                      <span style={{fontSize: '11px', color: '#a4b0be'}}>PDF, JPG, PNG</span>
                    </div>
                  )}
                  <input id="fssai-upload" type="file" accept=".pdf,.jpg,.png" required={!files.fssaiLicenseFile} style={{display: 'none'}} onChange={(e) => handleFileChange(e, 'fssaiLicenseFile')} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{gridColumn: '1 / -1', display: 'flex', gap: '20px', alignItems: 'flex-start'}}>
              <div style={{flex: 1}}>
                <label>GST Number</label>
                <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} required placeholder="GSTIN" />
              </div>
              <div style={{flex: 1}}>
                <label>Upload GST Certificate</label>
                <div style={{
                  position: 'relative', border: '2px dashed #dcdde1', borderRadius: '8px', 
                  padding: '15px', textAlign: 'center', cursor: 'pointer', backgroundColor: files.gstNumberFile ? '#f1fcf5' : '#f8f9fa',
                  transition: 'all 0.3s ease'
                }} onClick={() => document.getElementById('gst-upload').click()}>
                  {files.gstNumberFile ? (
                    <div style={{color: '#2ed573', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                      <CheckCircle size={24} style={{marginBottom: '5px'}} />
                      <span style={{fontSize: '12px', fontWeight: 'bold'}}>{files.gstNumberFile.name}</span>
                    </div>
                  ) : (
                    <div style={{color: '#747d8c', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                      <UploadCloud size={24} style={{marginBottom: '5px', color: '#ff4757'}} />
                      <span style={{fontSize: '13px'}}>Click to browse files</span>
                    </div>
                  )}
                  <input id="gst-upload" type="file" accept=".pdf,.jpg,.png" required={!files.gstNumberFile} style={{display: 'none'}} onChange={(e) => handleFileChange(e, 'gstNumberFile')} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{gridColumn: '1 / -1', display: 'flex', gap: '20px', alignItems: 'flex-start'}}>
              <div style={{flex: 1}}>
                <label>Owner ID Proof (Aadhar/PAN)</label>
                <input type="text" name="ownerIdProof" value={formData.ownerIdProof} onChange={handleChange} required placeholder="ID Number" />
              </div>
              <div style={{flex: 1}}>
                <label>Upload ID Proof</label>
                <div style={{
                  position: 'relative', border: '2px dashed #dcdde1', borderRadius: '8px', 
                  padding: '15px', textAlign: 'center', cursor: 'pointer', backgroundColor: files.ownerIdProofFile ? '#f1fcf5' : '#f8f9fa',
                  transition: 'all 0.3s ease'
                }} onClick={() => document.getElementById('id-upload').click()}>
                  {files.ownerIdProofFile ? (
                    <div style={{color: '#2ed573', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                      <CheckCircle size={24} style={{marginBottom: '5px'}} />
                      <span style={{fontSize: '12px', fontWeight: 'bold'}}>{files.ownerIdProofFile.name}</span>
                    </div>
                  ) : (
                    <div style={{color: '#747d8c', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                      <UploadCloud size={24} style={{marginBottom: '5px', color: '#ff4757'}} />
                      <span style={{fontSize: '13px'}}>Click to browse files</span>
                    </div>
                  )}
                  <input id="id-upload" type="file" accept=".pdf,.jpg,.png" required={!files.ownerIdProofFile} style={{display: 'none'}} onChange={(e) => handleFileChange(e, 'ownerIdProofFile')} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{gridColumn: '1 / -1', display: 'flex', gap: '20px', alignItems: 'flex-start'}}>
              <div style={{flex: 1}}>
                <label>Bank Details (Account No. & IFSC)</label>
                <input type="text" name="bankDetails" value={formData.bankDetails} onChange={handleChange} required placeholder="e.g. 1234567890, SBIN0001234" />
              </div>
              <div style={{flex: 1}}>
                <label>Cancelled Cheque / Passbook</label>
                <div style={{
                  position: 'relative', border: '2px dashed #dcdde1', borderRadius: '8px', 
                  padding: '15px', textAlign: 'center', cursor: 'pointer', backgroundColor: files.bankDetailsFile ? '#f1fcf5' : '#f8f9fa',
                  transition: 'all 0.3s ease'
                }} onClick={() => document.getElementById('bank-upload').click()}>
                  {files.bankDetailsFile ? (
                    <div style={{color: '#2ed573', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                      <CheckCircle size={24} style={{marginBottom: '5px'}} />
                      <span style={{fontSize: '12px', fontWeight: 'bold'}}>{files.bankDetailsFile.name}</span>
                    </div>
                  ) : (
                    <div style={{color: '#747d8c', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                      <UploadCloud size={24} style={{marginBottom: '5px', color: '#ff4757'}} />
                      <span style={{fontSize: '13px'}}>Click to browse files</span>
                    </div>
                  )}
                  <input id="bank-upload" type="file" accept=".pdf,.jpg,.png" required={!files.bankDetailsFile} style={{display: 'none'}} onChange={(e) => handleFileChange(e, 'bankDetailsFile')} />
                </div>
              </div>
            </div>

            <div style={{display: 'flex', gap: '10px', gridColumn: '1 / -1', marginTop: '10px'}}>
              <button type="button" className="btn-secondary" onClick={() => setStep(3)} style={{flex: 1}}>Back</button>
              <button type="submit" className="btn-primary" disabled={loading} style={{flex: 2}}>
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        )}

        <p className="auth-link" style={{marginTop: '20px'}}>Already a partner? <span onClick={() => navigate('/partner/login')}>Login here</span></p>
      </div>
    </div>
  );
}

export default PartnerRegister;
