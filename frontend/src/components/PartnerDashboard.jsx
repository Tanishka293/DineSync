import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Store, ListOrdered, Wallet, Settings, LogOut, TrendingUp, CheckCircle, XCircle, Headphones, Clock, Send, MessageSquare } from 'lucide-react';

function PartnerDashboard() {
  const [partner, setPartner] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [users, setUsers] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', imageUrl: '', prepDuration: '15-30 mins', inStock: true, dietaryPreference: 'Veg' });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [supportTickets, setSupportTickets] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [supportSuccessMsg, setSupportSuccessMsg] = useState("");
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === 'support') {
      scrollToBottom();
    }
  }, [supportTickets, activeTab]);

  useEffect(() => {
    const savedPartner = localStorage.getItem('partner');
    if (savedPartner) {
      const parsedPartner = JSON.parse(savedPartner);
      setPartner(parsedPartner);
      fetchMenu(parsedPartner.id);
      fetchOrders(parsedPartner.id);
      fetchTickets(parsedPartner.email);
      fetchPayouts(parsedPartner.id);
      fetchUsers();
    } else {
      navigate('/partner/login');
    }
  }, [navigate]);

  const fetchPayouts = (partnerId) => {
    axios.get(`http://localhost:8081/api/payouts/partner/${partnerId}`)
      .then(res => setPayouts(res.data))
      .catch(err => console.error(err));
  };

  const fetchTickets = (email) => {
    axios.get(`http://localhost:8081/api/support/tickets/user/${email}`)
      .then(res => setSupportTickets(res.data))
      .catch(err => console.error("Could not load support tickets", err));
  };

  const fetchUsers = () => {
    axios.get('http://localhost:8081/api/users/list')
      .then(res => setUsers(res.data))
      .catch(err => console.error("Error fetching users:", err));
  };

  const fetchMenu = (partnerId) => {
    axios.get('http://localhost:8081/api/catalog/items')
      .then(response => {
        const ourItems = response.data.filter(item => item.franchiseId === partnerId);
        setMenuItems(ourItems);
      })
      .catch(error => console.error("Error fetching menu:", error));
  };

  const fetchOrders = (partnerId) => {
    axios.get(`http://localhost:8081/api/orders/partner/${partnerId}`)
      .then(response => setOrders(response.data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch(error => console.error("Error fetching orders:", error));
  };

  useEffect(() => {
    if (partner) {
      const interval = setInterval(() => {
        fetchOrders(partner.id);
        fetchTickets(partner.email);
        fetchPayouts(partner.id);
      }, 5000); 
      return () => clearInterval(interval);
    }
  }, [partner]);

  const [editingItemId, setEditingItemId] = useState(null);

  const handleItemChange = (e) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem({ ...newItem, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const itemData = {
      ...newItem,
      price: parseFloat(newItem.price),
      franchiseId: partner.id,
      franchiseName: partner.name || partner.shopName || 'Unknown Partner',
      franchiseLocation: partner.location || 'Unknown Location'
    };

    if (editingItemId) {
      axios.put(`http://localhost:8081/api/catalog/items/${editingItemId}`, itemData)
        .then(response => {
          setMenuItems(menuItems.map(item => item.id === editingItemId ? response.data : item));
          setNewItem({ name: '', description: '', price: '', imageUrl: '', prepDuration: '15-30 mins', inStock: true, dietaryPreference: 'Veg' });
          setEditingItemId(null);
        })
        .catch(error => console.error("Error updating item:", error));
    } else {
      axios.post('http://localhost:8081/api/catalog/items', itemData)
        .then(response => {
          setMenuItems([...menuItems, response.data]);
          setNewItem({ name: '', description: '', price: '', imageUrl: '', prepDuration: '15-30 mins', inStock: true, dietaryPreference: 'Veg' });
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) fileInput.value = '';
        })
        .catch(error => console.error("Error adding item:", error));
    }
  };

  const startEditing = (item) => {
    setNewItem(item);
    setEditingItemId(item.id);
  };

  const deleteItem = (id) => {
    if (window.confirm("Delete this item permanently?")) {
      axios.delete(`http://localhost:8081/api/catalog/items/${id}`)
        .then(() => {
          setMenuItems(menuItems.filter(item => item.id !== id));
        })
        .catch(error => console.error("Error deleting item:", error));
    }
  };

  const toggleStock = (item) => {
    const updated = { ...item, inStock: !item.inStock };
    axios.put(`http://localhost:8081/api/catalog/items/${item.id}`, updated)
      .then(response => {
        setMenuItems(menuItems.map(i => i.id === item.id ? response.data : i));
      })
      .catch(error => console.error("Error toggling stock:", error));
  };

  const [loadingRejectId, setLoadingRejectId] = useState(null);

  const handleOrderAction = (orderId, action) => {
    let status = action;
    if (action === 'ACCEPT') status = 'ACCEPTED_PREPARING';
    if (action === 'REJECT') {
      status = 'REJECTED';
      if (!window.confirm("Rejecting this order will trigger a refund to the customer. Proceed?")) return;
      setLoadingRejectId(orderId);
      setTimeout(() => {
        axios.put(`http://localhost:8081/api/orders/${orderId}/status`, { status })
          .then(response => {
            setOrders(orders.map(order => order.id === orderId ? { ...order, status } : order));
            setLoadingRejectId(null);
            alert("Order rejected and refund initiated.");
          })
          .catch(error => {
            console.error("Error updating order:", error);
            setLoadingRejectId(null);
          });
      }, 1500);
      return;
    }
    
    axios.put(`http://localhost:8081/api/orders/${orderId}/status`, { status })
      .then(response => {
        setOrders(orders.map(order => order.id === orderId ? { ...order, status } : order));
      })
      .catch(error => console.error("Error updating order:", error));
  };

  const getOrderItemsText = (foodItemIdsStr) => {
    if (!foodItemIdsStr || !menuItems.length) return foodItemIdsStr || 'Unknown Items';
    const ids = foodItemIdsStr.split(',');
    return ids.map(id => {
      const item = menuItems.find(i => i.id === id);
      return item ? item.name : id;
    }).join(', ');
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (newQuestion.trim()) {
      axios.post('http://localhost:8081/api/support/tickets', {
        userEmail: partner.email,
        question: newQuestion
      }).then(res => {
        const newTicket = res.data;
        setSupportTickets([newTicket, ...supportTickets]);
        setNewQuestion("");
        setSupportSuccessMsg("Message sent successfully!");
        
        setTimeout(() => setSupportSuccessMsg(""), 3000);
      }).catch(err => console.error(err));
    }
  };

  if (!partner) return null;

  // Financial Calculations
  const completedOrders = orders.filter(o => o.status === 'DELIVERED');
  const pendingOrders = completedOrders.filter(o => o.payoutStatus === 'PENDING');
  
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  const commissionRate = partner.platformCommissionRate || 15;
  const netEarnings = totalRevenue * ((100 - commissionRate) / 100);
  const pendingPayout = pendingRevenue * ((100 - commissionRate) / 100);

  return (
    <div className="account-container">
      <div className="account-sidebar">
        <div className="sidebar-profile">
          <div className="avatar-circle" style={{backgroundColor: 'var(--primary)'}}>
            <Store size={32} color="white" />
          </div>
          <h3>{partner.name || partner.shopName}</h3>
          <p>ID: {partner.id}</p>
        </div>
        
        <ul className="sidebar-nav">
          <li className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')} style={{position: 'relative'}}>
            <CheckCircle size={18} /> Order Requests
            {orders.filter(o => o.status === 'PENDING_FRANCHISE_APPROVAL').length > 0 && (
              <span style={{position: 'absolute', right: '15px', width: '10px', height: '10px', backgroundColor: '#2ed573', borderRadius: '50%'}}></span>
            )}
          </li>
          <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
            <ListOrdered size={18} /> Live Orders
          </li>
          <li className={activeTab === 'menu' ? 'active' : ''} onClick={() => setActiveTab('menu')}>
            <Store size={18} /> Menu Management
          </li>
          <li className={activeTab === 'finance' ? 'active' : ''} onClick={() => setActiveTab('finance')}>
            <Wallet size={18} /> Finance & Wallet
          </li>
          <li className={activeTab === 'support' ? 'active' : ''} onClick={() => { setActiveTab('support'); }} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}><Headphones size={20} /> Support Help</div>
          </li>
          <li className="logout-item" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={18} /> Logout
          </li>
        </ul>
      </div>

      {showLogoutModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <div className="modal-icon-warning">
              <LogOut size={40} color="#ff4757" />
            </div>
            <h3>Close Shop?</h3>
            <p>Are you sure you want to log out of your Partner Dashboard?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn-primary" style={{backgroundColor: '#ff4757'}} onClick={() => {
                localStorage.removeItem('partner');
                window.location.href = '/partner/login';
              }}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}



      <div className="account-content">
        {activeTab === 'requests' && (
          <div className="orders-section">
            <h2 className="section-title">New Order Requests</h2>
            <div className="order-list">
              {orders.filter(o => o.status === 'PENDING_FRANCHISE_APPROVAL').length === 0 ? <p>No pending requests.</p> : orders.filter(o => o.status === 'PENDING_FRANCHISE_APPROVAL').map(order => (
                <div key={order.id} className="account-order-card" style={{padding: '15px', marginBottom: '15px', position: 'relative'}}>
                  <div className={`status-badge ${order.status?.toLowerCase() || 'pending'}`} style={{position: 'absolute', top: '15px', right: '15px'}}>
                    {order.status}
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{flex: 1}}>
                      <h4 style={{margin: '0 0 5px 0', fontSize: '16px'}}>Order #{order.id} <span style={{fontSize: '13px', color: '#747d8c', marginLeft: '10px'}}>{new Date(order.createdAt).toLocaleString()}</span></h4>
                      
                      <div style={{background: '#f8f9fa', padding: '8px', borderRadius: '4px', margin: '8px 0'}}>
                        <p style={{margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#2f3542'}}>Items: {getOrderItemsText(order.foodItemIds)}</p>
                      </div>

                      <p style={{margin: '0 0 3px 0', fontSize: '13px'}}><strong>Customer:</strong> {order.customerName} ({order.customerContact})</p>
                      <p style={{margin: '0 0 3px 0', fontSize: '13px'}}><strong>Deliver To:</strong> {order.deliveryAddress || 'N/A'}</p>
                      <h4 style={{margin: '5px 0 0 0', fontSize: '15px', color: 'var(--primary)'}}>Total: ₹{order.totalAmount}</h4>
                    </div>
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '130px', marginLeft: '20px'}}>
                      <button className="btn-success" style={{padding: '10px', fontSize: '14px', marginTop: '30px'}} onClick={() => handleOrderAction(order.id, 'ACCEPT')} disabled={loadingRejectId === order.id}>
                        <CheckCircle size={16} style={{display:'inline', verticalAlign:'middle', marginRight:'4px'}}/> Accept
                      </button>
                      <button className="btn-primary" style={{padding: '10px', fontSize: '14px', backgroundColor: '#ff4757'}} onClick={() => handleOrderAction(order.id, 'REJECT')} disabled={loadingRejectId === order.id}>
                        {loadingRejectId === order.id ? 'Refunding...' : <><XCircle size={16} style={{display:'inline', verticalAlign:'middle', marginRight:'4px'}}/> Reject</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <h2 className="section-title">Live Orders</h2>
            <div className="order-list">
              {orders.filter(o => o.status !== 'PENDING_FRANCHISE_APPROVAL' && o.status !== 'REJECTED' && o.status !== 'CANCELLED_REFUNDED' && o.status !== 'DELIVERED').length === 0 ? <p>No active orders.</p> : orders.filter(o => o.status !== 'PENDING_FRANCHISE_APPROVAL' && o.status !== 'REJECTED' && o.status !== 'CANCELLED_REFUNDED' && o.status !== 'DELIVERED').map(order => (
                <div key={order.id} className="account-order-card" style={{padding: '15px', marginBottom: '15px', position: 'relative'}}>
                  <div className={`status-badge ${order.status?.toLowerCase() || 'pending'}`} style={{position: 'absolute', top: '15px', right: '15px'}}>
                    {order.status}
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{flex: 1}}>
                      <h4 style={{margin: '0 0 5px 0', fontSize: '16px'}}>Order #{order.id} <span style={{fontSize: '13px', color: '#747d8c', marginLeft: '10px'}}>{new Date(order.createdAt).toLocaleString()}</span></h4>
                      
                      <div style={{background: '#f8f9fa', padding: '8px', borderRadius: '4px', margin: '8px 0'}}>
                        <p style={{margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#2f3542'}}>Items: {getOrderItemsText(order.foodItemIds)}</p>
                      </div>

                      {(() => {
                        const matchedUser = users.find(u => u.email === order.customerEmail);
                        const displayCusName = matchedUser?.name || order.customerName || 'Guest';
                        return (
                          <div style={{margin: '0 0 3px 0', fontSize: '13px'}}>
                            <strong>Customer:</strong> {displayCusName} <span style={{color: '#a4b0be', marginLeft: '5px'}}>({order.customerEmail})</span>
                            <div style={{marginTop: '2px'}}><strong>Contact:</strong> {order.customerContact}</div>
                          </div>
                        );
                      })()}
                      <p style={{margin: '0 0 3px 0', fontSize: '13px'}}><strong>Deliver To:</strong> {order.deliveryAddress || 'N/A'}</p>
                      <h4 style={{margin: '5px 0 0 0', fontSize: '15px', color: 'var(--primary)'}}>Total: ₹{order.totalAmount}</h4>
                    </div>
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '160px', marginLeft: '20px'}}>
                        {order.status === 'ACCEPTED_PREPARING' && (
                          <button className="btn-primary" style={{padding: '10px', fontSize: '14px', backgroundColor: '#eccc68', color: '#2f3542', border: 'none', marginTop: '30px'}} onClick={() => handleOrderAction(order.id, 'PACKED')}>
                            Mark Packed
                          </button>
                        )}
                        {order.status === 'PACKED' && (
                          <button className="btn-primary" style={{padding: '10px', fontSize: '14px', backgroundColor: '#ffa502', border: 'none', marginTop: '30px'}} onClick={() => handleOrderAction(order.id, 'ON_THE_WAY')}>
                            On the way
                          </button>
                        )}
                        {order.status === 'ON_THE_WAY' && (
                          <button className="btn-success" style={{padding: '10px', fontSize: '14px', marginTop: '30px'}} onClick={() => handleOrderAction(order.id, 'DELIVERED')}>
                            Mark Delivered
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="profile-section">
            <h2 className="section-title">Menu Management</h2>
            
            <div className="settings-card add-address-card mb-4">
              <div className="card-header">
                <h3>{editingItemId ? 'Edit Dish' : 'Add New Dish'}</h3>
              </div>
              <form onSubmit={handleAddItem} className="grid-form">
                <div className="form-group">
                  <label>Dish Name *</label>
                  <input type="text" name="name" value={newItem.name} onChange={handleItemChange} required />
                </div>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" name="price" value={newItem.price} onChange={handleItemChange} required />
                </div>
                <div className="form-group">
                  <label>Image *</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} required={!editingItemId} />
                  {newItem.imageUrl && <img src={newItem.imageUrl} alt="Preview" style={{width: '60px', height: '60px', marginTop: '10px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #edf2f7'}} />}
                </div>
                <div className="form-group">
                  <label>Preparation Time *</label>
                  <select name="prepDuration" value={newItem.prepDuration} onChange={handleItemChange} required style={{width: '100%', padding: '12px', border: '2px solid #edf2f7', borderRadius: '8px'}}>
                    <option value="5-10 mins">5-10 mins</option>
                    <option value="15-30 mins">15-30 mins</option>
                    <option value="30-45 mins">30-45 mins</option>
                    <option value="45+ mins">45+ mins</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Dietary Type *</label>
                  <select name="dietaryPreference" value={newItem.dietaryPreference} onChange={handleItemChange} required style={{width: '100%', padding: '12px', border: '2px solid #edf2f7', borderRadius: '8px'}}>
                    <option value="Veg">Vegetarian (Veg)</option>
                    <option value="Non-Veg">Non-Vegetarian (Non-Veg)</option>
                  </select>
                </div>
                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                  <label>Description *</label>
                  <input type="text" name="description" value={newItem.description} onChange={handleItemChange} required />
                </div>
                <div style={{gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '10px'}}>
                  <button type="submit" className="btn-primary" style={{flex: 1}}>{editingItemId ? 'Update Dish' : 'Add to Menu'}</button>
                  {editingItemId && (
                    <button type="button" className="btn-secondary" onClick={() => { setEditingItemId(null); setNewItem({ name: '', description: '', price: '', imageUrl: '', prepDuration: '15-30 mins', inStock: true, dietaryPreference: 'Veg' }); }}>Cancel Edit</button>
                  )}
                </div>
              </form>
            </div>

            <div className="settings-card mt-4">
              <div className="card-header">
                <h3>Your Menu Items</h3>
              </div>
              <div className="address-grid">
                {menuItems.map((item, idx) => (
                  <div key={idx} className="address-box" style={{opacity: item.inStock ? 1 : 0.6}}>
                    <div className="address-box-header">
                      <h4 style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <div style={{
                          width: '14px', height: '14px', border: `1px solid ${item.dietaryPreference === 'Non-Veg' ? '#e84118' : '#44bd32'}`, 
                          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1px'
                        }}>
                          <div style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.dietaryPreference === 'Non-Veg' ? '#e84118' : '#44bd32'}}></div>
                        </div>
                        {item.name}
                      </h4>
                      <div className="address-actions">
                        <button className="action-btn text-primary" onClick={() => startEditing(item)}>Edit</button>
                        <button className="action-btn text-danger" onClick={() => deleteItem(item.id)}>Delete</button>
                      </div>
                    </div>
                    <p style={{margin: '5px 0', fontSize: '0.9rem'}}>{item.description}</p>
                    <p><strong>Price:</strong> ₹{item.price}</p>
                    <p><strong>Prep Time:</strong> {item.prepDuration || '15-30 mins'}</p>
                    <div style={{marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span className={`status-badge ${item.inStock ? 'accepted_preparing' : 'rejected'}`}>{item.inStock ? 'In Stock' : 'Out of Stock'}</span>
                      <button className="btn-secondary" style={{padding: '5px 15px', fontSize: '0.85rem'}} onClick={() => toggleStock(item)}>
                        {item.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="profile-section">
            <h2 className="section-title">Finance & Wallet</h2>
            
            <div className="info-grid mb-4">
              <div className="settings-card" style={{textAlign: 'center', padding: '30px'}}>
                <TrendingUp size={36} color="var(--primary)" style={{marginBottom: '10px'}}/>
                <h3 style={{color: '#747d8c', fontSize: '1.1rem', marginBottom:'5px'}}>Total Sales</h3>
                <h2 style={{fontSize: '2rem', color: 'var(--secondary)'}}>₹{totalRevenue.toFixed(2)}</h2>
              </div>
              
              <div className="settings-card" style={{textAlign: 'center', padding: '30px', background: 'linear-gradient(135deg, var(--secondary) 0%, #1e272e 100%)', color: 'white'}}>
                <Wallet size={36} color="white" style={{marginBottom: '10px'}}/>
                <h3 style={{color: '#d1d8e0', fontSize: '1.1rem', marginBottom:'5px'}}>Pending Payout (Wallet)</h3>
                <h2 style={{fontSize: '2rem', color: 'white'}}>₹{pendingPayout.toFixed(2)}</h2>
                <p style={{fontSize: '0.85rem', color: '#a4b0be', marginTop:'10px'}}>Ready for Admin settlement</p>
              </div>
            </div>

            <div className="settings-card mt-4">
              <div className="card-header">
                <h3>Past Payouts</h3>
              </div>
              <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '10px'}}>
                <thead>
                  <tr style={{borderBottom: '2px solid #f1f2f6'}}>
                    <th style={{padding: '12px 0', color: '#57606f'}}>Transaction ID</th>
                    <th style={{padding: '12px 0', color: '#57606f'}}>Date</th>
                    <th style={{padding: '12px 0', color: '#57606f'}}>Amount Settled</th>
                    <th style={{padding: '12px 0', color: '#57606f'}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 ? (
                    <tr><td colSpan="4" style={{padding: '20px 0', textAlign: 'center', color: '#747d8c'}}>No payouts yet.</td></tr>
                  ) : payouts.map(p => (
                    <tr key={p.id} style={{borderBottom: '1px solid #f1f2f6'}}>
                      <td style={{padding: '12px 0', fontWeight: 'bold'}}>TXN-{p.id}</td>
                      <td style={{padding: '12px 0', color: '#747d8c'}}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td style={{padding: '12px 0', color: '#2ed573', fontWeight: 'bold'}}>₹{p.amount.toFixed(2)}</td>
                      <td style={{padding: '12px 0'}}><span className="status-badge delivered">PAID</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="settings-card mt-4">
              <div className="card-header">
                <h3>Recent Completed Orders</h3>
              </div>
              <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '10px'}}>
                <thead>
                  <tr style={{borderBottom: '2px solid #f1f2f6'}}>
                    <th style={{padding: '12px 0', color: '#57606f'}}>Order ID</th>
                    <th style={{padding: '12px 0', color: '#57606f'}}>Date</th>
                    <th style={{padding: '12px 0', color: '#57606f'}}>Customer Name</th>
                    <th style={{padding: '12px 0', color: '#57606f', textAlign: 'right'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrders.length === 0 ? (
                    <tr><td colSpan="4" style={{padding: '20px 0', textAlign: 'center', color: '#747d8c'}}>No completed orders yet.</td></tr>
                  ) : completedOrders.slice(0,10).map(o => {
                    const matchedUser = users.find(u => u.email === o.customerEmail);
                    const displayCusName = matchedUser?.name || o.customerName || 'Guest';
                    return (
                      <tr key={o.id} style={{borderBottom: '1px solid #f1f2f6'}}>
                        <td style={{padding: '12px 0', fontWeight: 'bold'}}>#{o.id}</td>
                        <td style={{padding: '12px 0', color: '#747d8c'}}>{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td style={{padding: '12px 0'}}>
                          <div style={{fontWeight: '500'}}>{displayCusName}</div>
                          <div style={{fontSize: '0.8rem', color: '#a4b0be'}}>{o.customerEmail}</div>
                        </td>
                        <td style={{padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)'}}>₹{o.totalAmount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="orders-section" style={{height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column'}}>
            <h2 className="section-title">Partner Support</h2>
            <div style={{display: 'flex', flex: 1, flexDirection: 'column', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #edf2f7'}}>
              {/* Chat Header */}
              <div style={{padding: '20px', borderBottom: '1px solid #edf2f7', background: '#fcfcfc'}}>
                <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <Headphones size={24} color="#3498db" />
                  Admin HQ Support
                </h3>
                <span style={{fontSize: '13px', color: '#747d8c', marginLeft: '34px'}}>We usually reply within a few hours.</span>
              </div>
              
              {/* Chat Window */}
              <div style={{flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', background: '#fff'}}>
                {supportTickets.length === 0 ? (
                  <div style={{textAlign: 'center', color: '#a4b0be', marginTop: 'auto', marginBottom: 'auto'}}>
                    <MessageSquare size={40} style={{opacity: 0.5, marginBottom: '10px'}} />
                    <p>No messages yet. Send a message to start a conversation with Admin.</p>
                  </div>
                ) : (
                  supportTickets.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)).map(ticket => (
                    <div key={ticket.id} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                      {/* Partner's Message */}
                      <div style={{alignSelf: 'flex-end', maxWidth: '80%', textAlign: 'right'}}>
                        <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px'}}>
                          <span style={{fontSize: '10px', color: '#a4b0be'}}>{new Date(ticket.createdAt).toLocaleString()}</span>
                          {ticket.status === 'PENDING' && <span style={{fontSize: '10px', color: '#ff9f43'}}>Sent</span>}
                        </div>
                        <div style={{background: '#3498db', padding: '12px 16px', borderRadius: '18px', borderBottomRightRadius: '4px', color: 'white', fontSize: '14px', textAlign: 'left', marginTop: '4px'}}>
                          {ticket.question}
                        </div>
                      </div>
                      
                      {/* Admin's Reply */}
                      {ticket.adminReply && ticket.adminReply.split('|||').map((replyPiece, idx) => (
                        <div key={idx} style={{alignSelf: 'flex-start', maxWidth: '80%', marginTop: idx > 0 ? '10px' : '0'}}>
                          <span style={{fontSize: '10px', color: '#a4b0be', marginLeft: '5px'}}>Admin</span>
                          <div style={{background: '#f1f2f6', padding: '12px 16px', borderRadius: '18px', borderBottomLeftRadius: '4px', color: '#2f3542', fontSize: '14px', marginTop: '4px'}}>
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
              <div style={{padding: '20px', background: '#f8f9fa', borderTop: '1px solid #edf2f7'}}>
                <form onSubmit={handleSupportSubmit} style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <input 
                    type="text"
                    value={newQuestion} 
                    onChange={(e) => setNewQuestion(e.target.value)} 
                    required 
                    placeholder="Type your message here..."
                    style={{flex: 1, padding: '15px 20px', borderRadius: '24px', border: '1px solid #dcdde1', outline: 'none', fontSize: '14px'}}
                  />
                  <button type="submit" style={{background: '#3498db', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: 'white', transition: 'transform 0.1s'}} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <Send size={20} style={{marginLeft: '-2px', marginTop: '2px'}}/>
                  </button>
                </form>
                {supportSuccessMsg && <div style={{color: '#2ed573', fontSize: '12px', marginTop: '8px', textAlign: 'center'}}>{supportSuccessMsg}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PartnerDashboard;
