import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Utensils, Star, Clock, Search, LogOut, User, Home, Store, MapPin, Heart } from 'lucide-react';
import './App.css';
import LandingPage from './components/LandingPage';
import UserLogin from './components/UserLogin';
import UserRegister from './components/UserRegister';
import PartnerRegister from './components/PartnerRegister';
import PartnerLogin from './components/PartnerLogin';
import PartnerDashboard from './components/PartnerDashboard';
import CartPage from './components/CartPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import UserAccount from './components/UserAccount';

function UserHome({ cart, setCart, searchQuery, showToast, userProfile, setUserProfile }) {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8081/api/catalog/items')
      .then(response => {
        setFoodItems(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching food items:", error);
        setLoading(false);
      });
  }, []);

  const handleAddToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      showToast(`${item.name} is already in your cart! You can increase the quantity there. 🛒`);
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
      showToast(`${item.name} added to cart! 🍽️`);
    }
  };

  const toggleFavorite = (e, item) => {
    e.stopPropagation();
    const isFavorite = userProfile?.favorites?.some(f => f.id === item.id);
    let newFavorites;
    if (isFavorite) {
      newFavorites = userProfile.favorites.filter(f => f.id !== item.id);
      showToast(`${item.name} removed from favorites!`);
    } else {
      newFavorites = [...(userProfile.favorites || []), item];
      showToast(`${item.name} added to favorites! ❤️`);
    }
    setUserProfile({ ...userProfile, favorites: newFavorites });
  };

  const filteredItems = foodItems.filter(item => 
    item.inStock !== false && // Defaults to true if undefined
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <>
      <header className="hero">
        <div className="hero-content">
          <h2>Craving Something Delicious?</h2>
          <p>Order from top restaurants with DineSync's lightning-fast delivery.</p>
        </div>
      </header>

      <main className="main-content">
        <h3 className="section-title">
          {searchQuery ? `Search Results for "${searchQuery}"` : "Popular Items"}
        </h3>
        
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading the menu...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="no-results">
            {searchQuery 
              ? `No dishes found for "${searchQuery}". Try a different search term!` 
              : "No dishes available right now. Restaurants will be adding more soon!"}
          </p>
        ) : (
          <div className="food-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="food-card">
                <div className="card-image-wrapper" style={{position: 'relative'}}>
                  <img src={item.imageUrl || "https://via.placeholder.com/300x200?text=Food"} alt={item.name} className="food-image" />
                  <div className="price-tag">₹{item.price}</div>
                  <button 
                    onClick={(e) => toggleFavorite(e, item)}
                    style={{
                      position: 'absolute', top: '10px', right: '10px', background: 'white', border: 'none', 
                      borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                  >
                    <Heart size={16} fill={userProfile?.favorites?.some(f => f.id === item.id) ? "#ff4757" : "transparent"} color={userProfile?.favorites?.some(f => f.id === item.id) ? "#ff4757" : "#747d8c"} />
                  </button>
                </div>
                <div className="card-content">
                  <h4 className="food-name" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{
                      width: '14px', height: '14px', border: `1px solid ${item.dietaryPreference === 'Non-Veg' ? '#e84118' : '#44bd32'}`, 
                      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1px', flexShrink: 0
                    }}>
                      <div style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.dietaryPreference === 'Non-Veg' ? '#e84118' : '#44bd32'}}></div>
                    </div>
                    {item.name}
                  </h4>
                  
                  <div style={{display: 'flex', alignItems: 'center', gap: '5px', margin: '5px 0', color: '#747d8c', fontSize: '0.85rem'}}>
                    <Store size={14} /> <span>{item.franchiseName || 'DineSync Partner'}</span>
                    {item.franchiseLocation && (
                      <>
                        <span style={{margin: '0 5px'}}>•</span>
                        <MapPin size={14} /> <span>{item.franchiseLocation}</span>
                      </>
                    )}
                  </div>

                  <p className="food-desc">{item.description}</p>
                  
                  <div className="card-meta">
                    <span className="rating">
                      <Star size={14} fill={item.ratingCount > 0 ? "#FFB800" : "#dcdde1"} stroke="none" /> 
                      {item.ratingCount > 0 ? item.averageRating.toFixed(1) : 'No ratings'}
                      {item.ratingCount > 0 && <span style={{fontSize: '0.75rem', marginLeft: '3px', color: '#a4b0be'}}>({item.ratingCount})</span>}
                    </span>
                    <span className="time"><Clock size={14} /> {item.prepDuration || '25-30 min'}</span>
                  </div>
                  
                  <div style={{display: 'flex', gap: '5px', marginTop: '10px'}}>
                    <button className="btn-secondary" style={{flex: 1, padding: '8px'}} onClick={() => setSelectedItem(item)}>Details</button>
                    <button className="add-btn" style={{flex: 2, margin: 0}} onClick={() => handleAddToCart(item)}>Add to Cart</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedItem && (
          <div className="custom-modal-overlay" onClick={() => setSelectedItem(null)}>
            <div className="custom-modal-content" onClick={e => e.stopPropagation()} style={{padding: '0', overflow: 'hidden', maxWidth: '600px', backgroundColor: 'white'}}>
              <img src={selectedItem.imageUrl} alt={selectedItem.name} style={{width: '100%', height: '300px', objectFit: 'cover'}} />
              <div style={{padding: '25px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h2 style={{margin: '0', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div style={{
                      width: '18px', height: '18px', border: `2px solid ${selectedItem.dietaryPreference === 'Non-Veg' ? '#e84118' : '#44bd32'}`, 
                      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1px', flexShrink: 0
                    }}>
                      <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: selectedItem.dietaryPreference === 'Non-Veg' ? '#e84118' : '#44bd32'}}></div>
                    </div>
                    {selectedItem.name}
                  </h2>
                  <h2 style={{margin: '0', color: '#2ed573', fontSize: '24px'}}>₹{selectedItem.price}</h2>
                </div>
                <p style={{color: '#747d8c', marginTop: '10px', fontSize: '15px'}}>
                  <Store size={16} style={{display:'inline', verticalAlign:'middle'}}/> {selectedItem.franchiseName} • <MapPin size={16} style={{display:'inline', verticalAlign:'middle'}}/> {selectedItem.franchiseLocation}
                </p>
                <div style={{marginTop: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #edf2f7'}}>
                  <h4 style={{margin: '0 0 10px 0'}}>Description</h4>
                  <p style={{margin: '0', fontSize: '15px', lineHeight: '1.6', color: '#2f3542'}}>{selectedItem.description}</p>
                </div>
                <div style={{display: 'flex', gap: '15px', marginTop: '25px'}}>
                  <button className="btn-secondary" style={{flex: 1}} onClick={() => setSelectedItem(null)}>Close</button>
                  <button className="btn-primary" style={{flex: 2}} onClick={() => { handleAddToCart(selectedItem); setSelectedItem(null); }}>Add to Cart</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// Layout wrapper for navbar
function AppLayout({ children, cart, user, searchQuery, setSearchQuery, toastMessage }) {
  const location = useLocation();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  const isLandingPage = location.pathname === '/';
  const isAuthPage = ['/user/login', '/user/register', '/partner/login', '/partner/register', '/admin/login'].includes(location.pathname);
  const isPartnerDashboard = location.pathname === '/partner/dashboard';
  const isAdminDashboard = location.pathname === '/admin/dashboard';

  // Hide Navbar completely on the central landing page and auth pages
  if (isLandingPage || isAuthPage || isPartnerDashboard || isAdminDashboard) {
    return <div className="app-container">{children}</div>;
  }

  return (
    <div className="app-container">
      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}
      <nav className="navbar">
        <div className="nav-logo">
          <Utensils size={28} className="logo-icon" />
          <Link to="/user/home" style={{ textDecoration: 'none', color: 'inherit' }}><h1>DineSync</h1></Link>
        </div>
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          
          <div className={`nav-search-container ${isSearchExpanded ? 'expanded' : ''}`} style={{ display: 'flex', alignItems: 'center' }}>
            {isSearchExpanded && (
              <input 
                type="text" 
                placeholder="Search dishes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                onBlur={() => {
                  if(!searchQuery) setIsSearchExpanded(false);
                }}
                className="nav-search-input"
              />
            )}
            <button className="cart-btn" onClick={() => setIsSearchExpanded(!isSearchExpanded)} title="Search">
              <Search size={20} />
            </button>
          </div>

          {user && (
            <>
              <Link to="/user/home" className="cart-btn" style={{ textDecoration: 'none' }} title="Home">
                <Home size={20} />
              </Link>
              <Link to="/user/account" className="cart-btn" style={{ textDecoration: 'none' }} title="Account Settings">
                <User size={20} />
              </Link>
            </>
          )}
          <Link to="/cart" className="cart-btn" style={{ textDecoration: 'none' }}>
            <ShoppingCart size={20} />
            <span className="cart-count">{cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}</span>
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}

function App() {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [toastMessage, setToastMessage] = useState('');
  
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) return JSON.parse(saved);
    return { 
      name: user?.name || '', 
      email: user?.email || '', 
      addresses: [],
      favorites: []
    };
  });

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    if (user && userProfile.email && user.email !== userProfile.email) {
      const saved = localStorage.getItem(`userProfile_${user.email}`);
      if (saved) {
        setUserProfile(JSON.parse(saved));
      } else {
        setUserProfile({
          name: user.name,
          email: user.email,
          addresses: [],
          favorites: []
        });
      }
    }
  }, [user, userProfile.email]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleUserLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    setUser(null);
    window.location.href = '/user/login';
  };

  return (
    <Router>
      <AppLayout cart={cart} user={user} handleUserLogout={handleUserLogout} searchQuery={searchQuery} setSearchQuery={setSearchQuery} toastMessage={toastMessage}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/user/home" element={<UserHome cart={cart} setCart={setCart} searchQuery={searchQuery} showToast={showToast} userProfile={userProfile} setUserProfile={setUserProfile} />} />
          <Route path="/user/account" element={<UserAccount user={user} userProfile={userProfile} setUserProfile={setUserProfile} showToast={showToast} setSearchQuery={setSearchQuery} />} />
          <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} userProfile={userProfile} showToast={showToast} />} />
          <Route path="/user/login" element={<UserLogin />} />
          <Route path="/user/register" element={<UserRegister />} />
          
          <Route path="/partner/register" element={<PartnerRegister />} />
          <Route path="/partner/login" element={<PartnerLogin />} />
          <Route path="/partner/dashboard" element={<PartnerDashboard />} />
          
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
