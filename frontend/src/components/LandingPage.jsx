import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Store, Shield } from 'lucide-react';

function LandingPage() {
  return (
    <div className="landing-container">
      <div className="landing-hero">
        <Utensils size={48} className="landing-logo" />
        <h1>Welcome to DineSync</h1>
        <p>Your ultimate food delivery ecosystem.</p>
      </div>
      
      <div className="roles-container">
        <Link to="/user/login" className="role-card user-card">
          <Utensils size={36} />
          <h3>Login as User</h3>
          <p>Order delicious food from your favorite restaurants.</p>
        </Link>
        
        <Link to="/partner/login" className="role-card partner-card">
          <Store size={36} />
          <h3>Login as Partner</h3>
          <p>Manage your restaurant menu and incoming orders.</p>
        </Link>

        <Link to="/admin/login" className="role-card admin-card">
          <Shield size={36} />
          <h3>Login as Admin</h3>
          <p>Monitor platform statistics and manage users.</p>
        </Link>
      </div>
    </div>
  );
}

export default LandingPage;
