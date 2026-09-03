import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Package, Clock, Settings, Store, Star, Heart, Headphones, MessageSquare, Send, Info, LogOut } from 'lucide-react';

function UserAccount({ user, userProfile: profile, setUserProfile: setProfile, showToast, setSearchQuery }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders_live');
  const [hoveredSection, setHoveredSection] = useState(null);
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [newAddress, setNewAddress] = useState({ name: '', contact: '', loc: '' });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hoveredRatings, setHoveredRatings] = useState({});
  const [supportTickets, setSupportTickets] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [supportSuccessMsg, setSupportSuccessMsg] = useState("");
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === 'support_main') {
      scrollToBottom();
    }
  }, [supportTickets, activeTab]);

  const handleRateOrder = (orderId, rating) => {
    axios.put(`http://localhost:8081/api/orders/${orderId}/rate`, { rating })
      .then(res => {
        setOrders(orders.map(o => o.id === orderId ? { ...o, rating } : o));
        showToast("Thanks for your feedback!");
      })
      .catch(err => console.error(err));
  };
  useEffect(() => {
    if (!user) {
      navigate('/user/login');
      return;
    }

    const fetchAllData = () => {
      axios.get(`http://localhost:8081/api/orders/user/${user.email}`)
        .then(res => setOrders(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
        .catch(err => console.error(err));

      axios.get(`http://localhost:8081/api/support/tickets/user/${user.email}`)
        .then(res => setSupportTickets(res.data))
        .catch(err => console.error("Could not load support tickets", err));
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);

    axios.get('http://localhost:8081/api/catalog/items')
      .then(res => setCatalog(res.data))
      .catch(err => console.error(err));

    return () => clearInterval(interval);
  }, [user, navigate, activeTab]);

  const [showAddressSuccessModal, setShowAddressSuccessModal] = useState(false);

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (newAddress.name && newAddress.contact && newAddress.loc) {
      const currentAddresses = profile?.addresses || [];
      setProfile({ ...profile, addresses: [...currentAddresses, newAddress] });
      setNewAddress({ name: '', contact: '', loc: '' });
      setShowAddressSuccessModal(true);
    }
  }

  const getOrderFranchise = (foodItemIdsStr) => {
    if (!foodItemIdsStr) return "Unknown Shop";
    const ids = foodItemIdsStr.split(',');
    if (ids.length === 0) return "Unknown Shop";
    const item = catalog.find(c => c.id.toString() === ids[0]);
    return item?.franchiseName || 'DineSync Partner';
  };

  const getOrderItems = (foodItemIdsStr) => {
    if (!foodItemIdsStr) return "Unknown items";
    const ids = foodItemIdsStr.split(',');
    const counts = {};
    ids.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });

    return Object.entries(counts).map(([id, qty]) => {
      const item = catalog.find(c => c.id.toString() === id);
      return item ? `${qty}x ${item.name}` : `${qty}x Unknown Item`;
    }).join(', ');
  };

  const [loadingRefundId, setLoadingRefundId] = useState(null);

  const handleCancelOrder = (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order? Your payment will be refunded.")) {
      setLoadingRefundId(orderId);
      setTimeout(() => {
        axios.put(`http://localhost:8081/api/orders/${orderId}/status`, { status: 'CANCELLED_REFUNDED' })
          .then(response => {
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'CANCELLED_REFUNDED' } : o));
            setLoadingRefundId(null);
            if (showToast) showToast("Order cancelled. Amount refunded to original payment method.");
          })
          .catch(error => {
            console.error("Error cancelling order:", error);
            setLoadingRefundId(null);
            if (showToast) showToast("Failed to cancel order.");
          });
      }, 1500);
    }
  };

  const handleDeleteAddress = (index) => {
    const newAddresses = [...(profile?.addresses || [])];
    newAddresses.splice(index, 1);
    setProfile({ ...profile, addresses: newAddresses });
    if (showToast) showToast("Address deleted successfully.");
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (newQuestion.trim()) {
      axios.post('http://localhost:8081/api/support/tickets', {
        userEmail: user.email,
        question: newQuestion
      }).then(res => {
        const newTicket = res.data;
        setSupportTickets([newTicket, ...supportTickets]);
        setNewQuestion("");
        setSupportSuccessMsg("Message sent successfully!");

        // Auto mark own sent message as read
        const newRead = [...readUserTickets, newTicket.id];
        setReadUserTickets(newRead);
        localStorage.setItem('readUserTickets', JSON.stringify(newRead));

        setTimeout(() => setSupportSuccessMsg(""), 3000);
      }).catch(err => console.error(err));
    }
  };

  if (!user) return null;

  return (
    <div className="account-container">
      <div className="account-sidebar">
        <div className="sidebar-profile">
          <div className="avatar-circle">
            <User size={32} color="white" />
          </div>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>

        <ul className="sidebar-nav">
          <li className={activeTab === 'orders_live' ? 'active' : ''} onClick={() => setActiveTab('orders_live')}>
            <Package size={18} style={{ marginRight: '8px' }} /> Live Orders
          </li>
          <li className={activeTab === 'orders_past' ? 'active' : ''} onClick={() => setActiveTab('orders_past')}>
            <Clock size={18} style={{ marginRight: '8px' }} /> Past Orders
          </li>

          <li className={activeTab === 'profile_main' ? 'active' : ''} onClick={() => setActiveTab('profile_main')} style={{ marginTop: '15px' }}>
            <User size={18} style={{ marginRight: '8px' }} /> Profile & Addresses
          </li>
          <li className={activeTab === 'profile_favorites' ? 'active' : ''} onClick={() => setActiveTab('profile_favorites')}>
            <Heart size={18} style={{ marginRight: '8px' }} /> Favourites
          </li>

          <li className={activeTab === 'support_main' ? 'active' : ''} onClick={() => setActiveTab('support_main')} style={{ marginTop: '15px' }}>
            <Headphones size={18} style={{ marginRight: '8px' }} /> Customer Support
          </li>

          <li className="logout-item" onClick={() => setShowLogoutModal(true)} style={{ marginTop: '15px' }}>
            <LogOut size={18} style={{ marginRight: '8px' }} /> Logout
          </li>
        </ul>
      </div>

      {showLogoutModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <div className="modal-icon-warning">
              <User size={40} color="#ff4757" />
            </div>
            <h3>Ready to leave?</h3>
            <p>Are you sure you want to log out of your DineSync account?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ backgroundColor: '#ff4757' }} onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('userProfile');
                window.location.href = '/user/login';
              }}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddressSuccessModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <div className="modal-icon-warning" style={{ background: 'rgba(46, 213, 115, 0.1)' }}>
              <MapPin size={40} color="#2ed573" />
            </div>
            <h3>Address Saved!</h3>
            <p>Your new delivery address has been added to your profile successfully.</p>
            <div className="modal-actions">
              <button className="btn-primary" style={{ backgroundColor: '#2ed573', width: '100%' }} onClick={() => setShowAddressSuccessModal(false)}>
                Okay
              </button>
            </div>
          </div>
        </div>
      )}



      <div className="account-content">
        {activeTab.startsWith('orders') && (() => {
          const pastStatuses = ['DELIVERED', 'CANCELLED_REFUNDED', 'REJECTED'];
          const filteredOrders = orders.filter(o =>
            activeTab === 'orders_past'
              ? pastStatuses.includes(o.status)
              : !pastStatuses.includes(o.status)
          );

          return (
            <div className="orders-section">
              <h2 className="section-title">{activeTab === 'orders_live' ? 'Live Orders' : 'Past Orders'}</h2>
              {filteredOrders.length === 0 ? (
                <p>{activeTab === 'orders_live' ? "You don't have any active orders right now." : "You haven't completed any orders yet."}</p>
              ) : (
                <div className="order-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  {filteredOrders.map(order => (
                    <div key={order.id} className="order-card account-order-card" style={{ padding: '15px' }}>
                      <div className="order-header" style={{ marginBottom: '10px' }}>
                        <div>
                          <h4 style={{ fontSize: '15px', margin: 0 }}>Order #{order.id}</h4>
                          <span className="order-date" style={{ fontSize: '12px' }}><Clock size={12} /> {new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        <div className={`status-badge ${order.status?.toLowerCase() || 'pending'}`} style={{ fontSize: '12px', padding: '4px 8px' }}>
                          {order.status}
                        </div>
                      </div>

                      <div className="order-body">
                        <div className="items-list-premium" style={{ padding: '6px', fontSize: '13px', margin: '0' }}>
                          <Store size={14} className="mr-2" style={{ color: '#747d8c' }} />
                          <span><strong>From:</strong> {getOrderFranchise(order.foodItemIds)}</span>
                        </div>
                        <div className="items-list-premium" style={{ padding: '6px', fontSize: '13px', margin: '5px 0' }}>
                          <Package size={14} className="mr-2" />
                          <span><strong>Items:</strong> {getOrderItems(order.foodItemIds)}</span>
                        </div>
                        <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Delivery Address:</strong> {order.deliveryAddress}</p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '2px dashed #f1f2f6' }}>
                          {order.status === 'PENDING_FRANCHISE_APPROVAL' ? (
                            <button
                              className="btn-danger"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '15px' }}
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={loadingRefundId === order.id}
                            >
                              {loadingRefundId === order.id ? 'Processing Refund...' : 'Cancel Order'}
                            </button>
                          ) : order.status === 'DELIVERED' ? (
                            <div
                              style={{ display: 'flex', gap: '5px', cursor: 'pointer' }}
                              title="Rate this order"
                              onMouseLeave={() => setHoveredRatings({ ...hoveredRatings, [order.id]: 0 })}
                            >
                              {[1, 2, 3, 4, 5].map(star => {
                                const currentRating = hoveredRatings[order.id] || order.rating || 0;
                                const isFilled = star <= currentRating;
                                return (
                                  <Star
                                    key={star}
                                    size={16}
                                    fill={isFilled ? "#FFB800" : "transparent"}
                                    stroke={isFilled ? "#FFB800" : "#dcdde1"}
                                    onMouseEnter={() => setHoveredRatings({ ...hoveredRatings, [order.id]: star })}
                                    onClick={() => handleRateOrder(order.id, star)}
                                    style={{ transition: 'all 0.2s ease' }}
                                  />
                                )
                              })}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#747d8c' }}>
                              {['CANCELLED_REFUNDED', 'REJECTED'].includes(order.status) ? 'Order Closed' : 'Preparing delivery...'}
                            </span>
                          )}
                          <h4 className="order-total" style={{ borderTop: 'none', padding: 0, margin: 0, fontSize: '15px' }}>Total: ₹{order.totalAmount}</h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {activeTab.startsWith('profile') && (
          <div className="profile-section">
            <h2 className="section-title" style={{ marginBottom: '15px' }}>Profile & Settings</h2>

            {activeTab === 'profile_main' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Personal Info */}
                <div className="settings-card user-info-card">
                  <div className="card-header">
                    <h3>Personal Information</h3>
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Full Name</span>
                      <span className="info-value">{profile?.name || user?.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email Address</span>
                      <span className="info-value">{profile?.email || user?.email}</span>
                    </div>
                  </div>
                </div>

                {/* Manage Addresses */}
                <div className="settings-card">
                  <div className="card-header">
                    <h3><MapPin size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> Manage Addresses</h3>
                  </div>

                  {/* Saved Addresses */}
                  {(profile?.addresses?.length > 0) && (
                    <div className="address-grid" style={{ marginBottom: '20px' }}>
                      {profile.addresses.map((addr, idx) => (
                        <div key={idx} className="address-box">
                          <div className="address-box-header">
                            <h4>{addr.name}</h4>
                            <div className="address-actions">
                              <button className="action-btn text-danger" onClick={() => handleDeleteAddress(idx)}>Delete</button>
                            </div>
                          </div>
                          <p><strong>Contact:</strong> {addr.contact}</p>
                          <p><strong>Address:</strong> {addr.loc}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Address */}
                  <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '15px' }}>
                    <h4 style={{ marginBottom: '15px' }}>Add a New Address</h4>
                    <form onSubmit={handleAddAddress} className="add-address-form grid-form">
                      <div className="form-group">
                        <label>Label (e.g., Home, Office)</label>
                        <input type="text" value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} required placeholder="Home" />
                      </div>
                      <div className="form-group">
                        <label>Contact Number</label>
                        <input type="text" value={newAddress.contact} onChange={(e) => setNewAddress({ ...newAddress, contact: e.target.value })} required placeholder="+91..." />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                          Full Address (Locality, Pincode)
                          <span
                            style={{ color: '#3498db', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                            onClick={() => {
                              if (navigator.geolocation) {
                                if (showToast) showToast("Fetching location...");
                                navigator.geolocation.getCurrentPosition(async (position) => {
                                  const lat = position.coords.latitude;
                                  const lon = position.coords.longitude;
                                  try {
                                    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                                    if (response.data && response.data.display_name) {
                                      setNewAddress({ ...newAddress, loc: response.data.display_name });
                                      if (showToast) showToast("Location applied!");
                                    } else {
                                      setNewAddress({ ...newAddress, loc: `Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(4)}` });
                                    }
                                  } catch (error) {
                                    console.error("Error fetching address:", error);
                                    setNewAddress({ ...newAddress, loc: `Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(4)}` });
                                  }
                                }, () => {
                                  alert("Unable to retrieve your location.");
                                });
                              }
                            }}
                          >
                            <MapPin size={14} /> Use Current Location
                          </span>
                        </label>
                        <textarea value={newAddress.loc} onChange={(e) => setNewAddress({ ...newAddress, loc: e.target.value })} required className="address-textarea" placeholder="Street, Locality, Pincode..."></textarea>
                      </div>
                      <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>Save Address</button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Favourites */}
            {activeTab === 'profile_favorites' && (
              <div className="settings-card">
                <div className="card-header">
                  <h3><Heart size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px', color: '#ff4757' }} fill="#ff4757" /> Favourites</h3>
                </div>
                {(!profile?.favorites || profile.favorites.length === 0) ? (
                  <p className="no-data">You haven't added any favourites yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {profile.favorites.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSearchQuery(item.name);
                          navigate('/user/home');
                        }}
                        style={{ display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', gap: '15px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#edf2f7'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      >
                        <img src={item.imageUrl || "https://via.placeholder.com/300x200?text=Food"} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{item.name}</h4>
                          <p style={{ margin: 0, fontSize: '12px', color: '#747d8c' }}><Store size={12} style={{ display: 'inline' }} /> {item.franchiseName}</p>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#2ed573' }}>₹{item.price}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfile({ ...profile, favorites: profile.favorites.filter(f => f.id !== item.id) });
                            if (showToast) showToast("Removed from favourites");
                          }}
                          style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', padding: '5px' }}
                          title="Remove"
                        >
                          <Heart size={18} fill="#ff4757" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'support_main' && (
          <div className="orders-section" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
            <h2 className="section-title">Customer Support</h2>
            <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>

              {/* FAQs Section (Left Side) */}
              <div style={{ width: '350px', background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Info size={20} color="#3498db" /> FAQs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #3498db' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>How do I track my order?</h4>
                    <p style={{ margin: 0, color: '#747d8c', fontSize: '13px' }}>You can track the status of your live orders directly from the 'Live Orders' section.</p>
                  </div>
                  <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #3498db' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>What happens if my order is delayed?</h4>
                    <p style={{ margin: 0, color: '#747d8c', fontSize: '13px' }}>If an order takes significantly longer than expected, please use the chat support.</p>
                  </div>
                  <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #3498db' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>How can I get a refund?</h4>
                    <p style={{ margin: 0, color: '#747d8c', fontSize: '13px' }}>Refunds for cancelled orders are processed automatically and reflect in your account within 3-5 business days.</p>
                  </div>
                </div>
              </div>

              {/* Chat Section (Right Side) */}
              <div style={{ display: 'flex', flex: 1, flexDirection: 'column', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' }}>
                {/* Chat Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid #edf2f7', background: '#fcfcfc' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Headphones size={24} color="#3498db" />
                    Admin Support
                  </h3>
                  <span style={{ fontSize: '13px', color: '#747d8c', marginLeft: '34px' }}>We're here to help you with your orders.</span>
                </div>

                {/* Chat Window */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', background: '#fff' }}>
                  {supportTickets.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#a4b0be', marginTop: 'auto', marginBottom: 'auto' }}>
                      <MessageSquare size={40} style={{ opacity: 0.5, marginBottom: '10px' }} />
                      <p>No messages yet. Send a message to start a conversation with Support.</p>
                    </div>
                  ) : (
                    supportTickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(ticket => (
                      <div key={ticket.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* User's Message */}
                        <div style={{ alignSelf: 'flex-end', maxWidth: '80%', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '10px', color: '#a4b0be' }}>{new Date(ticket.createdAt).toLocaleString()}</span>
                            {ticket.status === 'PENDING' && <span style={{ fontSize: '10px', color: '#ff9f43' }}>Sent</span>}
                          </div>
                          <div style={{ background: '#3498db', padding: '12px 16px', borderRadius: '18px', borderBottomRightRadius: '4px', color: 'white', fontSize: '14px', textAlign: 'left', marginTop: '4px' }}>
                            {ticket.question}
                          </div>
                        </div>

                        {/* Admin's Reply */}
                        {ticket.adminReply && ticket.adminReply.split('|||').map((replyPiece, idx) => (
                          <div key={idx} style={{ alignSelf: 'flex-start', maxWidth: '80%', marginTop: idx > 0 ? '10px' : '0' }}>
                            <span style={{ fontSize: '10px', color: '#a4b0be', marginLeft: '5px' }}>Support Agent</span>
                            <div style={{ background: '#f1f2f6', padding: '12px 16px', borderRadius: '18px', borderBottomLeftRadius: '4px', color: '#2f3542', fontSize: '14px', marginTop: '4px' }}>
                              {replyPiece}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Message Input */}
                <div style={{ padding: '20px', borderTop: '1px solid #edf2f7', background: '#fcfcfc' }}>
                  <form onSubmit={handleSupportSubmit} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Type your message to support..."
                      style={{ flex: 1, padding: '12px 15px', borderRadius: '8px', border: '1px solid #dcdde1', outline: 'none' }}
                      required
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Send size={18} /> Send
                    </button>
                  </form>
                  {supportSuccessMsg && <div style={{ color: '#2ed573', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>{supportSuccessMsg}</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserAccount;
