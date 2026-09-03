import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Store, DollarSign, ListOrdered, LogOut, TrendingUp, MessageSquare, Briefcase, FileText, CheckCircle, AlertCircle, Info, Send, Activity, MapPin, Wallet, XCircle, Search, ChevronRight, User, Settings, Shield, Mail } from 'lucide-react';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [partners, setPartners] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [expandedPartner, setExpandedPartner] = useState(null);
  const [expandedSupportEmail, setExpandedSupportEmail] = useState(null);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [partnerSortBy, setPartnerSortBy] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [replySuccessMsg, setReplySuccessMsg] = useState('');
  const [readAdminTickets, setReadAdminTickets] = useState(() => JSON.parse(localStorage.getItem('readAdminTickets') || '[]'));
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [expandedSupportEmail, tickets]);

  // Custom Dialog State
  const [dialog, setDialog] = useState(null); // { type: 'alert' | 'prompt', title: '', message: '', onConfirm: fn, onCancel: fn, inputValue: '', icon: JSX }
  const [expandedOrder, setExpandedOrder] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const admin = localStorage.getItem('admin');
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchData = () => {
    axios.get('http://localhost:8081/api/partner/list')
      .then(res => setPartners(res.data))
      .catch(err => console.error(err));

    axios.get('http://localhost:8081/api/users/list')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));

    axios.get('http://localhost:8081/api/support/tickets')
      .then(res => setTickets(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (partners.length > 0) {
      let allOrders = [];
      const approvedPartners = partners.filter(p => p.status === 'APPROVED');
      const fetchPromises = approvedPartners.map(p =>
        axios.get(`http://localhost:8081/api/orders/partner/${p.id}`)
          .then(res => allOrders.push(...res.data))
          .catch(e => console.error(e))
      );

      Promise.all(fetchPromises).then(() => {
        const uniqueOrders = Array.from(new Map(allOrders.map(item => [item.id, item])).values());
        setOrders(uniqueOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      });
    }
  }, [partners]);

  const handleApprovePartner = (id) => {
    axios.post(`http://localhost:8081/api/partner/admin/approve/${id}`)
      .then(res => {
        setDialog({
          type: 'alert', title: 'Application Approved! 🎉',
          message: 'Partner approved successfully! Credentials have been auto-generated and sent directly to their email.',
          icon: <CheckCircle size={40} color="#2ed573" />,
          onConfirm: () => { setDialog(null); setExpandedPartner(null); fetchData(); }
        });
      })
      .catch(err => setDialog({
        type: 'alert', title: 'Error', message: 'An error occurred while approving the partner.',
        icon: <AlertCircle size={40} color="#ff4757" />, onConfirm: () => setDialog(null)
      }));
  };

  const handleRejectPartner = (id) => {
    setDialog({
      type: 'prompt',
      title: 'Reject Application',
      message: 'Please provide a reason for rejecting this application (optional). This will be emailed to the partner.',
      icon: <Info size={40} color="#ff4757" />,
      inputValue: '',
      onConfirm: (reason) => {
        setDialog(null);
        axios.post(`http://localhost:8081/api/partner/admin/reject/${id}`, { reason })
          .then(res => {
            setDialog({
              type: 'alert', title: 'Application Rejected', message: 'Partner rejected. A polite notification has been sent to their email.',
              icon: <CheckCircle size={40} color="#2ed573" />,
              onConfirm: () => { setDialog(null); setExpandedPartner(null); fetchData(); }
            });
          })
          .catch(err => setDialog({
            type: 'alert', title: 'Error', message: 'An error occurred while rejecting the partner.',
            icon: <AlertCircle size={40} color="#ff4757" />, onConfirm: () => setDialog(null)
          }));
      },
      onCancel: () => setDialog(null)
    });
  };

  const handleBanPartner = (id, partnerName) => {
    setDialog({
      type: 'prompt',
      title: `Suspend Partner`,
      message: `Please provide a reason for suspending ${partnerName}. This will be emailed to them.`,
      icon: <AlertCircle size={40} color="#ff4757" />,
      inputValue: '',
      onConfirm: (reason) => {
        setDialog(null);
        axios.post(`http://localhost:8081/api/partner/admin/suspend/${id}`, { reason })
          .then(res => {
            setDialog({
              type: 'alert', title: 'Partner Suspended', message: 'The partner has been suspended successfully.',
              icon: <CheckCircle size={40} color="#2ed573" />,
              onConfirm: () => { setDialog(null); fetchData(); }
            });
          })
          .catch(err => setDialog({
            type: 'alert', title: 'Error', message: 'An error occurred while suspending the partner.',
            icon: <AlertCircle size={40} color="#ff4757" />, onConfirm: () => setDialog(null)
          }));
      },
      onCancel: () => setDialog(null)
    });
  };

  const handleUnbanPartner = (id, partnerName) => {
    setDialog({
      type: 'alert',
      title: `Restore ${partnerName}?`,
      message: `Are you sure you want to restore ${partnerName}? This will immediately grant them access to their dashboard again and an email notification will be sent.`,
      icon: <Info size={40} color="#3498db" />,
      onConfirm: () => {
        setDialog(null);
        axios.post(`http://localhost:8081/api/partner/admin/unban/${id}`)
          .then(res => {
            setDialog({
              type: 'alert', title: 'Partner Restored', message: 'The partner has been successfully unbanned and restored.',
              icon: <CheckCircle size={40} color="#2ed573" />,
              onConfirm: () => { setDialog(null); fetchData(); }
            });
          })
          .catch(err => setDialog({
            type: 'alert', title: 'Error', message: 'An error occurred while restoring the partner.',
            icon: <AlertCircle size={40} color="#ff4757" />, onConfirm: () => setDialog(null)
          }));
      },
      onCancel: () => setDialog(null)
    });
  };

  const handleReplyTicket = (id, existingReply = null) => {
    if (!replyText) return;
    const finalReply = existingReply ? existingReply + '|||' + replyText : replyText;
    axios.post(`http://localhost:8081/api/support/tickets/${id}/reply`, { reply: finalReply })
      .then(res => {
        setReplySuccessMsg('Reply sent successfully!');
        setReplyText('');
        fetchData();
        setTimeout(() => setReplySuccessMsg(''), 3000);
      })
      .catch(err => setDialog({
        type: 'alert', title: 'Error', message: 'An error occurred while sending the reply.',
        icon: <AlertCircle size={40} color="#ff4757" />, onConfirm: () => setDialog(null)
      }));
  };

  const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommission = totalRevenue * 0.15;

  const handleSettlePayout = (franchiseId, amount, partnerName) => {
    if (amount <= 0) return;
    setDialog({
      type: 'alert',
      title: `Settle Payout for ${partnerName}?`,
      message: `You are about to process a payout of ₹${amount}. This will zero out their pending balance and mark their orders as settled.`,
      icon: <Wallet size={40} color="#2ed573" />,
      onConfirm: () => {
        setDialog(null);
        axios.post(`http://localhost:8081/api/payouts/settle/${franchiseId}`, { amount })
          .then(res => {
            fetchData();
            setDialog({
              type: 'alert', title: 'Payout Successful! 💸',
              message: `₹${amount} has been successfully settled for ${partnerName}.`,
              icon: <CheckCircle size={40} color="#2ed573" />,
              onConfirm: () => setDialog(null)
            });
          })
          .catch(err => {
            console.error(err);
            setDialog({
              type: 'alert', title: 'Error', message: 'An error occurred while settling the payout.',
              icon: <AlertCircle size={40} color="#ff4757" />, onConfirm: () => setDialog(null)
            });
          });
      },
      onCancel: () => setDialog(null)
    });
  };

  const partnerEmails = new Set(partners.map(p => p.email));
  const partnerTickets = tickets.filter(t => partnerEmails.has(t.userEmail));
  const userTickets = tickets.filter(t => !partnerEmails.has(t.userEmail));

  const groupTicketsByEmail = (ticketList) => {
    const grouped = {};
    ticketList.forEach(t => {
      if (!grouped[t.userEmail]) grouped[t.userEmail] = [];
      grouped[t.userEmail].push(t);
    });
    return grouped;
  };

  const groupedPartnerTickets = groupTicketsByEmail(partnerTickets);
  const groupedUserTickets = groupTicketsByEmail(userTickets);

  const pendingUserTicketsCount = userTickets.filter(t => t.status === 'PENDING' && !readAdminTickets.includes(t.id)).length;
  const pendingPartnerTicketsCount = partnerTickets.filter(t => t.status === 'PENDING' && !readAdminTickets.includes(t.id)).length;

  const markConversationAsRead = (email, groupedTickets) => {
    const tkts = groupedTickets[email] || [];
    const newRead = [...readAdminTickets];
    let changed = false;
    tkts.forEach(t => {
      if (!newRead.includes(t.id)) {
        newRead.push(t.id);
        changed = true;
      }
    });
    if (changed) {
      setReadAdminTickets(newRead);
      localStorage.setItem('readAdminTickets', JSON.stringify(newRead));
    }
  };

  return (
    <div className="account-container">
      {/* Custom Dialog Overlay */}
      {dialog && (
        <div className="custom-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="custom-modal-content" style={{ maxWidth: '450px', padding: '30px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              {dialog.icon}
            </div>
            <h3 style={{ fontSize: '22px', marginBottom: '10px' }}>{dialog.title}</h3>
            <p style={{ color: '#747d8c', marginBottom: '20px', lineHeight: '1.5' }}>{dialog.message}</p>

            {dialog.type === 'prompt' && (
              <textarea
                placeholder="Type your reason here..."
                value={dialog.inputValue}
                onChange={(e) => setDialog({ ...dialog, inputValue: e.target.value })}
                style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #dcdde1', minHeight: '100px', marginBottom: '20px' }}
              />
            )}

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {dialog.type === 'prompt' && (
                <button className="btn-secondary" style={{ flex: 1 }} onClick={dialog.onCancel}>Cancel</button>
              )}
              <button className="btn-primary" style={{ flex: 1, backgroundColor: dialog.type === 'prompt' ? '#ff4757' : '#2ed573' }} onClick={() => dialog.onConfirm(dialog.inputValue)}>
                {dialog.type === 'prompt' ? 'Confirm Rejection' : 'Awesome'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="account-sidebar" style={{ background: '#1e272e' }}>
        <div className="sidebar-profile">
          <div className="avatar-circle" style={{ backgroundColor: '#ff4757' }}>
            <LayoutDashboard size={32} color="white" />
          </div>
          <h3 style={{ color: 'white' }}>Admin HQ</h3>
          <p style={{ color: '#a4b0be' }}>System Administrator</p>
        </div>

        <ul className="sidebar-nav admin-nav">
          <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')} style={{ fontWeight: activeTab === 'overview' ? '700' : '500' }}>
            <TrendingUp size={18} /> Overview
          </li>
          <li className={activeTab === 'partners' ? 'active' : ''} onClick={() => setActiveTab('partners')} style={{ fontWeight: activeTab === 'partners' ? '700' : '500' }}>
            <Store size={18} /> Partner Network
          </li>
          <li className={activeTab === 'wallets' ? 'active' : ''} onClick={() => setActiveTab('wallets')} style={{ fontWeight: activeTab === 'wallets' ? '700' : '500' }}>
            <Wallet size={18} /> Partner Wallets
          </li>
          <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')} style={{ fontWeight: activeTab === 'users' ? '700' : '500' }}>
            <Users size={18} /> User Network
          </li>
          <li className={activeTab === 'partner_requests' ? 'active' : ''} onClick={() => setActiveTab('partner_requests')} style={{ fontWeight: activeTab === 'partner_requests' ? '700' : '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Briefcase size={18} /> Partner Requests</div>
            {partners.filter(p => p.status === 'PENDING').length > 0 && <span style={{ width: '10px', height: '10px', backgroundColor: '#2ed573', borderRadius: '50%' }}></span>}
          </li>
          <li className={activeTab === 'suspended' ? 'active' : ''} onClick={() => setActiveTab('suspended')} style={{ fontWeight: activeTab === 'suspended' ? '700' : '500' }}>
            <AlertCircle size={18} /> Suspended Accounts
          </li>
          <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')} style={{ fontWeight: activeTab === 'orders' ? '700' : '500' }}>
            <ListOrdered size={18} /> Global Orders
          </li>
          <li className={activeTab === 'customer_requests' ? 'active' : ''} onClick={() => { setActiveTab('customer_requests'); setExpandedSupportEmail(null); }} style={{ fontWeight: activeTab === 'customer_requests' ? '700' : '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><MessageSquare size={18} /> Customer Support</div>
            {pendingUserTicketsCount > 0 && <span style={{ width: '10px', height: '10px', backgroundColor: '#2ed573', borderRadius: '50%' }}></span>}
          </li>
          <li className={activeTab === 'partner_support' ? 'active' : ''} onClick={() => { setActiveTab('partner_support'); setExpandedSupportEmail(null); }} style={{ fontWeight: activeTab === 'partner_support' ? '700' : '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><MessageSquare size={18} /> Partner Support</div>
            {pendingPartnerTicketsCount > 0 && <span style={{ width: '10px', height: '10px', backgroundColor: '#2ed573', borderRadius: '50%' }}></span>}
          </li>
          <li className="logout-item" onClick={() => setShowLogoutModal(true)} style={{ color: '#ff4757', borderTopColor: '#2f3640' }}>
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
            <h3>Logout Admin?</h3>
            <p>Are you sure you want to end this administrative session?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ backgroundColor: '#ff4757' }} onClick={() => {
                localStorage.removeItem('admin');
                window.location.href = '/admin/login';
              }}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}

      <div className="account-content" style={{ backgroundColor: '#f1f2f6' }}>
        {activeTab === 'overview' && (
          <div className="orders-section">
            <h2 className="section-title">Platform Overview (Business Dashboard)</h2>

            {/* 1. KPIs */}
            <div className="address-grid" style={{ marginBottom: '30px' }}>
              <div className="settings-card" style={{ background: 'linear-gradient(135deg, #1e90ff, #00a8ff)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px', boxShadow: '0 10px 20px rgba(30, 144, 255, 0.2)' }}>
                <DollarSign size={40} color="white" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '2rem', margin: '0' }}>₹{totalRevenue.toFixed(2)}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Total GMV (Gross Revenue)</p>
              </div>
              <div className="settings-card" style={{ background: 'linear-gradient(135deg, #2ed573, #7bed9f)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px', boxShadow: '0 10px 20px rgba(46, 213, 115, 0.2)' }}>
                <TrendingUp size={40} color="white" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '2rem', margin: '0' }}>₹{totalCommission.toFixed(2)}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Platform Earnings (15%)</p>
              </div>
              <div className="settings-card" style={{ background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px', border: '1px solid #edf2f7' }}>
                <Store size={40} color="#ffa502" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '2rem', margin: '0', color: '#2f3542' }}>{partners.filter(p => p.status === 'APPROVED').length}</h3>
                <p style={{ color: '#747d8c', marginTop: '5px', fontSize: '0.9rem' }}>Active Partners</p>
              </div>
              <div className="settings-card" style={{ background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px', border: '1px solid #edf2f7' }}>
                <Users size={40} color="#ff4757" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '2rem', margin: '0', color: '#2f3542' }}>{new Set(orders.map(o => o.userEmail)).size}</h3>
                <p style={{ color: '#747d8c', marginTop: '5px', fontSize: '0.9rem' }}>Active Customers</p>
              </div>
            </div>

            {/* 2. Split View: Live Feed & System Health */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

              {/* Left Column: Operations Feed */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #edf2f7' }}>
                <h3 style={{ margin: '0 0 20px 0', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px', color: '#2f3640', display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={20} color="#1e90ff" /> Live Operations Feed</h3>

                {/* Pending Partners */}
                {partners.filter(p => p.status === 'PENDING').length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#ffa502', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>⚠️ Pending Approvals ({partners.filter(p => p.status === 'PENDING').length})</h4>
                    {partners.filter(p => p.status === 'PENDING').slice(0, 3).map(p => (
                      <div key={p.id} style={{ padding: '12px', background: '#fff5f5', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{p.name || p.shopName}</strong> applied to join.
                          <div style={{ fontSize: '0.8rem', color: '#747d8c' }}>{p.location}</div>
                        </div>
                        <button className="btn-primary" style={{ padding: '5px 10px', fontSize: '0.8rem', margin: 0 }} onClick={() => setActiveTab('partner_requests')}>Review</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Orders */}
                <div>
                  <h4 style={{ color: '#2ed573', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Live Orders</h4>
                  {orders.length === 0 ? (
                    <p style={{ color: '#747d8c', fontSize: '0.9rem' }}>No recent orders.</p>
                  ) : (
                    <div style={{ background: 'white', border: '1px solid #f1f2f6', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #f1f2f6' }}>
                          <tr>
                            <th style={{ padding: '10px 12px', color: '#747d8c', fontWeight: '600' }}>Order #</th>
                            <th style={{ padding: '10px 12px', color: '#747d8c', fontWeight: '600' }}>Partner</th>
                            <th style={{ padding: '10px 12px', color: '#747d8c', fontWeight: '600' }}>Value</th>
                            <th style={{ padding: '10px 12px', color: '#747d8c', fontWeight: '600' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 4).map(o => (
                            <tr key={o.id} style={{ borderBottom: '1px solid #f1f2f6' }}>
                              <td style={{ padding: '10px 12px' }}>
                                <strong>#{o.id}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#747d8c' }}>{new Date(o.createdAt).toLocaleTimeString()}</div>
                              </td>
                              <td style={{ padding: '10px 12px', color: '#57606f' }}>{o.franchiseName || 'Partner'}</td>
                              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#2f3542' }}>₹{o.totalAmount}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span className={`status-badge ${o.status.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>{o.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Financial Snapshot & Alerts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#2f3640', color: 'white', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#f1f2f6', display: 'flex', alignItems: 'center', gap: '10px' }}><Briefcase size={20} /> Financial Snapshot</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #57606f', paddingBottom: '10px' }}>
                    <span style={{ color: '#a4b0be' }}>Pending Payouts:</span>
                    <strong style={{ color: '#ffa502' }}>₹{(totalRevenue - totalCommission).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#a4b0be' }}>Today's Orders:</span>
                    <strong>{orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length}</strong>
                  </div>
                  <button className="btn-primary" style={{ width: '100%', marginTop: '15px', background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setActiveTab('orders')}>View Ledger</button>
                </div>

                <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #edf2f7' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#2f3640', display: 'flex', alignItems: 'center', gap: '10px' }}><AlertCircle size={20} color="#ff4757" /> System Alerts</h3>
                  {(pendingUserTicketsCount + pendingPartnerTicketsCount) > 0 ? (
                    <div style={{ padding: '10px', background: '#ffeaa7', color: '#d35400', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Info size={16} /> <strong>{pendingUserTicketsCount + pendingPartnerTicketsCount} Support Tickets require attention.</strong>
                    </div>
                  ) : (
                    <div style={{ padding: '10px', background: '#e8f8f5', color: '#16a085', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle size={16} /> All systems operational. No active alerts.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="orders-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Active Partner Network</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Search name or location..."
                  value={partnerSearchQuery}
                  onChange={(e) => setPartnerSearchQuery(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #dcdde1', width: '250px' }}
                />
                <select
                  value={partnerSortBy}
                  onChange={(e) => setPartnerSortBy(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #dcdde1', background: 'white' }}
                >
                  <option value="all">Default (All)</option>
                  <option value="revenue">Highest Revenue</option>
                  <option value="orders">Most Orders</option>
                  <option value="success">Highest Success Rate</option>
                </select>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #edf2f7', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #edf2f7' }}>
                  <tr>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Partner</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Location</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Gross Sales</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Orders</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>AOV</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Success</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let approvedPartners = partners.filter(p => p.status === 'APPROVED');

                    if (partnerSearchQuery) {
                      const q = partnerSearchQuery.toLowerCase();
                      approvedPartners = approvedPartners.filter(p =>
                        (p.name && p.name.toLowerCase().includes(q)) ||
                        (p.shopName && p.shopName.toLowerCase().includes(q)) ||
                        (p.email && p.email.toLowerCase().includes(q)) ||
                        (p.location && p.location.toLowerCase().includes(q))
                      );
                    }

                    const partnersWithStats = approvedPartners.map(partner => {
                      const pOrders = orders.filter(o => o.franchiseId === partner.id);
                      const pDelivered = pOrders.filter(o => o.status === 'DELIVERED');
                      const pRevenue = pDelivered.reduce((s, o) => s + (o.totalAmount || 0), 0);
                      const aov = pDelivered.length > 0 ? (pRevenue / pDelivered.length).toFixed(0) : 0;
                      const successRate = pOrders.length > 0 ? ((pDelivered.length / pOrders.length) * 100).toFixed(0) : 0;
                      return { ...partner, pOrders, pRevenue, aov, successRate };
                    });

                    partnersWithStats.sort((a, b) => {
                      if (partnerSortBy === 'revenue') return b.pRevenue - a.pRevenue;
                      if (partnerSortBy === 'orders') return b.pOrders.length - a.pOrders.length;
                      if (partnerSortBy === 'success') return b.successRate - a.successRate;
                      return 0;
                    });

                    if (partnersWithStats.length === 0) return <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#747d8c' }}>No matching partners found.</td></tr>;

                    return partnersWithStats.map(partner => (
                      <React.Fragment key={partner.id}>
                        <tr style={{ borderBottom: '1px solid #f1f2f6' }}>
                          <td style={{ padding: '15px', fontWeight: 'bold', color: '#2f3542' }}>{partner.name || partner.shopName}</td>
                          <td style={{ padding: '15px', color: '#57606f', fontSize: '0.9rem' }}><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} />{partner.location || 'Not Set'}</td>
                          <td style={{ padding: '15px', color: '#2ed573', fontWeight: 'bold' }}>₹{partner.pRevenue.toFixed(2)}</td>
                          <td style={{ padding: '15px', color: '#2f3542' }}>{partner.pOrders.length}</td>
                          <td style={{ padding: '15px', color: '#2f3542' }}>₹{partner.aov}</td>
                          <td style={{ padding: '15px', color: partner.successRate >= 90 ? '#2ed573' : (partner.successRate >= 70 ? '#ffa502' : '#ff4757'), fontWeight: 'bold' }}>{partner.successRate}%</td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                              <button className="btn-secondary" style={{ margin: 0, padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => { setActiveTab('partner_support'); setExpandedSupportEmail(partner.email); }}>Msg</button>
                              <button className="btn-secondary" style={{ margin: 0, padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => setExpandedPartner(expandedPartner === partner.id ? null : partner.id)}>
                                {expandedPartner === partner.id ? 'Hide' : 'Details'}
                              </button>
                              <button className="btn-primary" style={{ margin: 0, padding: '5px 10px', fontSize: '0.8rem', background: '#ff4757' }} onClick={() => handleBanPartner(partner.id, partner.name || partner.shopName)}>Ban</button>
                            </div>
                          </td>
                        </tr>
                        {expandedPartner === partner.id && (
                          <tr style={{ background: '#f8f9fa' }}>
                            <td colSpan="7" style={{ padding: '20px', borderBottom: '2px solid #dcdde1' }}>
                              <h5 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #dcdde1', paddingBottom: '5px', color: '#2f3542' }}>Business Profile Details</h5>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', fontSize: '0.9rem', color: '#57606f' }}>
                                <p style={{ margin: '0' }}><strong>Owner:</strong> {partner.ownerName}</p>
                                <p style={{ margin: '0' }}><strong>Email:</strong> {partner.email}</p>
                                <p style={{ margin: '0' }}><strong>Login ID:</strong> {partner.username || 'Not Generated'}</p>
                                <p style={{ margin: '0' }}><strong>Contact:</strong> {partner.contactNumber}</p>
                                <p style={{ margin: '0' }}><strong>ID Proof:</strong> {partner.ownerIdProof}</p>
                                <p style={{ margin: '0' }}><strong>FSSAI:</strong> {partner.fssaiLicense}</p>
                                <p style={{ margin: '0' }}><strong>GST:</strong> {partner.gstNumber}</p>
                                <p style={{ margin: '0' }}><strong>Bank Details:</strong> {partner.bankDetails}</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'wallets' && (
          <div className="orders-section">
            <h2 className="section-title">Partner Wallets & Payouts</h2>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #edf2f7', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #edf2f7' }}>
                  <tr>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Partner</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Bank Details</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Pending Balance</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const approvedPartners = partners.filter(p => p.status === 'APPROVED');
                    if (approvedPartners.length === 0) return <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#747d8c' }}>No approved partners yet.</td></tr>;

                    return approvedPartners.map(partner => {
                      const pOrders = orders.filter(o => o.franchiseId === partner.id);
                      const pendingOrders = pOrders.filter(o => o.status === 'DELIVERED' && o.payoutStatus === 'PENDING');
                      const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                      const platformCut = partner.platformCommissionRate || 15;
                      const pendingPayout = pendingRevenue * ((100 - platformCut) / 100);

                      return (
                        <tr key={partner.id} style={{ borderBottom: '1px solid #f1f2f6', background: pendingPayout > 0 ? '#fffdf7' : 'white' }}>
                          <td style={{ padding: '15px' }}>
                            <div style={{ fontWeight: 'bold', color: '#2f3542' }}>{partner.name || partner.shopName}</div>
                            <div style={{ fontSize: '0.85rem', color: '#747d8c' }}>{partner.email}</div>
                          </td>
                          <td style={{ padding: '15px', color: '#57606f', fontSize: '0.9rem' }}>{partner.bankDetails || 'N/A'}</td>
                          <td style={{ padding: '15px', color: pendingPayout > 0 ? '#ffa502' : '#a4b0be', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            ₹{pendingPayout.toFixed(2)}
                          </td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                            <button
                              className="btn-primary"
                              disabled={pendingPayout <= 0}
                              style={{ padding: '8px 15px', fontSize: '0.9rem', opacity: pendingPayout <= 0 ? 0.5 : 1, background: pendingPayout > 0 ? '#2ed573' : '#a4b0be' }}
                              onClick={() => handleSettlePayout(partner.id, pendingPayout.toFixed(2), partner.name || partner.shopName)}
                            >
                              Settle Payout
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="orders-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>User Network</h2>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #edf2f7', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #edf2f7' }}>
                  <tr>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>User ID</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Customer Details</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Verification</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Total Orders</th>
                    <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Total Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const userOrders = orders.filter(o => o.customerEmail === user.email || o.userEmail === user.email);
                    const totalSpent = userOrders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + (o.totalAmount || 0), 0);

                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f1f2f6' }}>
                        <td style={{ padding: '15px' }}>
                          <strong style={{ color: '#2f3542', fontSize: '1rem' }}>#{user.id}</strong>
                        </td>
                        <td style={{ padding: '15px', color: '#57606f', fontSize: '0.9rem' }}>
                          <strong>{user.name || 'N/A'}</strong><br />
                          <span style={{ fontSize: '0.8rem', color: '#747d8c' }}>{user.email}</span>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span className={`status-badge ${user.verified ? 'delivered' : 'pending'}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                            {user.verified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#2f3542' }}>
                          {userOrders.length} orders
                        </td>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#2ed573' }}>
                          ₹{totalSpent.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#747d8c' }}>No users registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Master Financial Ledger</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Search Order ID or Email..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #dcdde1', width: '250px' }}
                />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #dcdde1', background: 'white' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DELIVERED">Delivered (Completed)</option>
                  <option value="PREPARING">Preparing (Active)</option>
                  <option value="PENDING">Pending (New)</option>
                  <option value="REJECTED">Rejected (Failed)</option>
                </select>
              </div>
            </div>

            {(() => {
              let filteredOrders = orders;

              if (orderStatusFilter !== 'ALL') {
                filteredOrders = filteredOrders.filter(o => o.status === orderStatusFilter);
              }

              if (orderSearchQuery) {
                const q = orderSearchQuery.toLowerCase();
                filteredOrders = filteredOrders.filter(o =>
                  (o.id && o.id.toLowerCase().includes(q)) ||
                  (o.userEmail && o.userEmail.toLowerCase().includes(q)) ||
                  (o.franchiseName && o.franchiseName.toLowerCase().includes(q))
                );
              }

              const ledgerRevenue = filteredOrders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
              const ledgerCommission = ledgerRevenue * 0.15;

              return (
                <>
                  {/* Summary Bar */}
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, background: 'linear-gradient(135deg, #2f3640, #353b48)', color: 'white', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 5px 0', color: '#a4b0be', fontSize: '0.9rem' }}>Filtered Delivered Revenue</p>
                        <h3 style={{ margin: 0, fontSize: '1.8rem' }}>₹{ledgerRevenue.toFixed(2)}</h3>
                      </div>
                      <DollarSign size={40} color="#2ed573" opacity={0.8} />
                    </div>
                    <div style={{ flex: 1, background: 'linear-gradient(135deg, #192a56, #273c75)', color: 'white', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 5px 0', color: '#a4b0be', fontSize: '0.9rem' }}>Filtered Platform Commission</p>
                        <h3 style={{ margin: 0, fontSize: '1.8rem' }}>₹{ledgerCommission.toFixed(2)}</h3>
                      </div>
                      <TrendingUp size={40} color="#00a8ff" opacity={0.8} />
                    </div>
                  </div>

                  {/* Table */}
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #edf2f7', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #edf2f7' }}>
                        <tr>
                          <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Order ID / Date</th>
                          <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Customer</th>
                          <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Partner</th>
                          <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Gross Value</th>
                          <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Platform Cut</th>
                          <th style={{ padding: '15px', color: '#747d8c', fontWeight: '600', fontSize: '0.9rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#747d8c' }}>No orders match the current filters.</td></tr>
                        ) : (
                          filteredOrders.map(order => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #f1f2f6', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                              <td style={{ padding: '15px' }}>
                                <strong style={{ color: '#2f3542', fontSize: '1rem' }}>#{order.id}</strong>
                                <div style={{ fontSize: '0.8rem', color: '#a4b0be' }}>{new Date(order.createdAt).toLocaleString()}</div>
                              </td>
                              <td style={{ padding: '15px', color: '#57606f', fontSize: '0.9rem' }}>
                                <strong>{order.customerName || 'Guest'}</strong><br />
                                <span style={{ fontSize: '0.8rem', color: '#747d8c' }}>{order.customerEmail || order.userEmail || 'N/A'}</span>
                              </td>
                              <td style={{ padding: '15px', color: '#57606f', fontSize: '0.9rem' }}>
                                <strong>{order.franchiseName || 'N/A'}</strong><br />
                                <span style={{ fontSize: '0.8rem', color: '#747d8c' }}>{partners.find(p => p.id === order.franchiseId)?.email || 'N/A'}</span>
                              </td>
                              <td style={{ padding: '15px', fontWeight: 'bold', color: '#2f3542' }}>₹{order.totalAmount}</td>
                              <td style={{ padding: '15px', fontWeight: 'bold', color: '#2ed573' }}>₹{(order.totalAmount * 0.15).toFixed(2)}</td>
                              <td style={{ padding: '15px' }}>
                                <span className={`status-badge ${order.status.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>{order.status}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'partner_requests' && (
          <div className="orders-section">
            <h2 className="section-title">Partner Applications</h2>
            <div className="order-list">
              {partners.filter(p => p.status === 'PENDING').length === 0 ? <p>No pending partner applications.</p> : partners.filter(p => p.status === 'PENDING').map(partner => (
                <div key={partner.id} className="account-order-card" style={{ background: 'white' }}>
                  <div className="order-header">
                    <div>
                      <h4>{partner.name}</h4>
                      <span className="order-date">Applied recently</span>
                    </div>
                    <div className="status-badge pending">
                      Action Required
                    </div>
                  </div>
                  <div className="order-body">
                    <p><strong>Owner Name:</strong> {partner.ownerName}</p>
                    <p><strong>Email:</strong> {partner.email}</p>
                    <p><strong>Location:</strong> {partner.location}</p>

                    {expandedPartner === partner.id ? (
                      <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dcdde1' }}>
                        <h5 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #dcdde1', paddingBottom: '5px' }}>Document Details</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <p><strong>Contact:</strong> {partner.contactNumber}</p>
                          <p><strong>ID Proof:</strong> {partner.ownerIdProof} <FileText size={14} color="#3742fa" style={{ verticalAlign: 'middle', cursor: 'pointer' }} onClick={() => { if (partner.ownerIdProofFile) { const win = window.open(); win.document.write(`<iframe src="${partner.ownerIdProofFile}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`); } else alert("No file uploaded!"); }} /></p>
                          <p><strong>FSSAI:</strong> {partner.fssaiLicense} <FileText size={14} color="#3742fa" style={{ verticalAlign: 'middle', cursor: 'pointer' }} onClick={() => { if (partner.fssaiLicenseFile) { const win = window.open(); win.document.write(`<iframe src="${partner.fssaiLicenseFile}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`); } else alert("No file uploaded!"); }} /></p>
                          <p><strong>GST:</strong> {partner.gstNumber} <FileText size={14} color="#3742fa" style={{ verticalAlign: 'middle', cursor: 'pointer' }} onClick={() => { if (partner.gstNumberFile) { const win = window.open(); win.document.write(`<iframe src="${partner.gstNumberFile}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`); } else alert("No file uploaded!"); }} /></p>
                          <p style={{ gridColumn: '1 / -1' }}><strong>Bank Details:</strong> {partner.bankDetails} <FileText size={14} color="#3742fa" style={{ verticalAlign: 'middle', cursor: 'pointer' }} onClick={() => { if (partner.bankDetailsFile) { const win = window.open(); win.document.write(`<iframe src="${partner.bankDetailsFile}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`); } else alert("No file uploaded!"); }} /></p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setExpandedPartner(null)}>Hide Details</button>
                          <button className="btn-primary" style={{ flex: 1, backgroundColor: '#ff4757', color: 'white' }} onClick={() => handleRejectPartner(partner.id)}>Reject</button>
                          <button className="btn-primary" style={{ flex: 1, backgroundColor: '#2ed573' }} onClick={() => handleApprovePartner(partner.id)}>Approve</button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn-secondary" style={{ marginTop: '15px', width: '100%', padding: '10px' }} onClick={() => setExpandedPartner(partner.id)}>Review Application</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'suspended' && (
          <div className="orders-section">
            <h2 className="section-title">Suspended Accounts</h2>
            <div className="order-list">
              {partners.filter(p => p.status === 'SUSPENDED').length === 0 ? <p style={{ color: '#747d8c' }}>No suspended partner accounts.</p> : partners.filter(p => p.status === 'SUSPENDED').map(partner => (
                <div key={partner.id} className="account-order-card" style={{ background: '#fff0f0', borderLeft: '4px solid #ff4757' }}>
                  <div className="order-header">
                    <div>
                      <h4 style={{ color: '#ff4757' }}>{partner.name || partner.shopName}</h4>
                      <span className="order-date">Status: Suspended</span>
                    </div>
                    <div className="status-badge" style={{ background: '#ff4757', color: 'white' }}>
                      BANNED
                    </div>
                  </div>
                  <div className="order-body">
                    <p><strong>Owner Name:</strong> {partner.ownerName}</p>
                    <p><strong>Email:</strong> {partner.email}</p>
                    <p><strong>Location:</strong> {partner.location}</p>

                    <button className="btn-primary" style={{ marginTop: '15px', width: '100%', padding: '10px', backgroundColor: '#2ed573' }} onClick={() => handleUnbanPartner(partner.id, partner.name || partner.shopName)}>Restore / Unban Partner</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'customer_requests' && (
          <div className="orders-section" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
            <h2 className="section-title">Customer Support Messaging</h2>
            <div style={{ display: 'flex', flex: 1, background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' }}>
              {/* Left Pane - Contact List */}
              <div style={{ width: '300px', borderRight: '1px solid #edf2f7', overflowY: 'auto', background: '#f8f9fa' }}>
                {Object.keys(groupedUserTickets).length === 0 ? <p style={{ padding: '20px', textAlign: 'center', color: '#747d8c' }}>No requests.</p> :
                  Object.keys(groupedUserTickets).map(email => {
                    const userTkts = groupedUserTickets[email];
                    const hasPending = userTkts.some(t => t.status === 'PENDING' && !readAdminTickets.includes(t.id));
                    const isActive = expandedSupportEmail === email;

                    return (
                      <div
                        key={email}
                        onClick={() => { setExpandedSupportEmail(email); markConversationAsRead(email, groupedUserTickets); }}
                        style={{
                          padding: '15px',
                          borderBottom: '1px solid #edf2f7',
                          cursor: 'pointer',
                          background: isActive ? '#e3f2fd' : 'transparent',
                          borderLeft: hasPending ? '4px solid #ff4757' : (isActive ? '4px solid #3498db' : '4px solid transparent'),
                          transition: 'background 0.2s'
                        }}
                      >
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#2f3542', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {email}
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#747d8c' }}>{userTkts.length} message(s)</span>
                          {hasPending && <span style={{ width: '8px', height: '8px', backgroundColor: '#ff4757', borderRadius: '50%' }}></span>}
                        </div>
                      </div>
                    );
                  })
                }
              </div>

              {/* Right Pane - Chat Window */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                {!expandedSupportEmail ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#a4b0be', flexDirection: 'column' }}>
                    <MessageSquare size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <p>Select a conversation to start messaging</p>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '20px', borderBottom: '1px solid #edf2f7', background: '#fcfcfc' }}>
                      <h3 style={{ margin: 0 }}>{expandedSupportEmail}</h3>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {(groupedUserTickets[expandedSupportEmail] || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(ticket => (
                        <div key={ticket.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                            <span style={{ fontSize: '10px', color: '#a4b0be', marginLeft: '5px' }}>{new Date(ticket.createdAt).toLocaleString()}</span>
                            <div style={{ background: '#f1f2f6', padding: '12px 16px', borderRadius: '18px', borderBottomLeftRadius: '4px', color: '#2f3542', fontSize: '14px' }}>
                              {ticket.question}
                            </div>
                          </div>

                          {ticket.status === 'REPLIED' && ticket.adminReply && ticket.adminReply.split('|||').map((replyPiece, idx) => (
                            <div key={idx} style={{ alignSelf: 'flex-end', maxWidth: '80%', textAlign: 'right', marginTop: idx > 0 ? '10px' : '0' }}>
                              <span style={{ fontSize: '10px', color: '#a4b0be', marginRight: '5px' }}>Admin</span>
                              <div style={{ background: '#3498db', padding: '12px 16px', borderRadius: '18px', borderBottomRightRadius: '4px', color: 'white', textAlign: 'left', fontSize: '14px', marginTop: '4px' }}>
                                {replyPiece}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Unified Message Input */}
                    <div style={{ padding: '20px', background: '#f8f9fa', borderTop: '1px solid #edf2f7' }}>
                      {(() => {
                        const userTkts = groupedUserTickets[expandedSupportEmail] || [];
                        const targetTicket = [...userTkts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="text"
                              placeholder="Type a message..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyPress={(e) => { if (e.key === 'Enter' && targetTicket) handleReplyTicket(targetTicket.id, targetTicket.adminReply); }}
                              style={{ flex: 1, padding: '15px 20px', borderRadius: '24px', border: '1px solid #dcdde1', outline: 'none', fontSize: '14px' }}
                            />
                            <button
                              onClick={() => { if (targetTicket) handleReplyTicket(targetTicket.id, targetTicket.adminReply); }}
                              style={{ background: '#3498db', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: 'white', transition: 'transform 0.1s' }}
                              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <Send size={20} style={{ marginLeft: '-2px', marginTop: '2px' }} />
                            </button>
                          </div>
                        );
                      })()}
                      {replySuccessMsg && <div style={{ color: '#2ed573', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>{replySuccessMsg}</div>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'partner_support' && (
          <div className="orders-section" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
            <h2 className="section-title">Partner Support Messaging</h2>
            <div style={{ display: 'flex', flex: 1, background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' }}>
              {/* Left Pane - Contact List */}
              <div style={{ width: '300px', borderRight: '1px solid #edf2f7', overflowY: 'auto', background: '#f8f9fa' }}>
                {Object.keys(groupedPartnerTickets).length === 0 ? <p style={{ padding: '20px', textAlign: 'center', color: '#747d8c' }}>No requests.</p> :
                  Object.keys(groupedPartnerTickets).map(email => {
                    const partnerTkts = groupedPartnerTickets[email];
                    const hasPending = partnerTkts.some(t => t.status === 'PENDING' && !readAdminTickets.includes(t.id));
                    const isActive = expandedSupportEmail === email;
                    const partnerName = partners.find(p => p.email === email)?.name || 'Unknown Partner';

                    return (
                      <div
                        key={email}
                        onClick={() => { setExpandedSupportEmail(email); markConversationAsRead(email, groupedPartnerTickets); }}
                        style={{
                          padding: '15px',
                          borderBottom: '1px solid #edf2f7',
                          cursor: 'pointer',
                          background: isActive ? '#e3f2fd' : 'transparent',
                          borderLeft: hasPending ? '4px solid #ff4757' : (isActive ? '4px solid #3498db' : '4px solid transparent'),
                          transition: 'background 0.2s'
                        }}
                      >
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#2f3542', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {partnerName}
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#747d8c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{email}</span>
                          {hasPending && <span style={{ width: '8px', height: '8px', backgroundColor: '#ff4757', borderRadius: '50%' }}></span>}
                        </div>
                      </div>
                    );
                  })
                }
              </div>

              {/* Right Pane - Chat Window */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                {!expandedSupportEmail ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#a4b0be', flexDirection: 'column' }}>
                    <MessageSquare size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <p>Select a partner conversation to start messaging</p>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '20px', borderBottom: '1px solid #edf2f7', background: '#fcfcfc' }}>
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Store size={20} color="#1e90ff" />
                        {partners.find(p => p.email === expandedSupportEmail)?.name || expandedSupportEmail}
                      </h3>
                      <span style={{ fontSize: '13px', color: '#747d8c' }}>{expandedSupportEmail}</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {(groupedPartnerTickets[expandedSupportEmail] || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(ticket => (
                        <div key={ticket.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                            <span style={{ fontSize: '10px', color: '#a4b0be', marginLeft: '5px' }}>{new Date(ticket.createdAt).toLocaleString()}</span>
                            <div style={{ background: '#f1f2f6', padding: '12px 16px', borderRadius: '18px', borderBottomLeftRadius: '4px', color: '#2f3542', fontSize: '14px' }}>
                              {ticket.question}
                            </div>
                          </div>

                          {ticket.status === 'REPLIED' && ticket.adminReply && ticket.adminReply.split('|||').map((replyPiece, idx) => (
                            <div key={idx} style={{ alignSelf: 'flex-end', maxWidth: '80%', textAlign: 'right', marginTop: idx > 0 ? '10px' : '0' }}>
                              <span style={{ fontSize: '10px', color: '#a4b0be', marginRight: '5px' }}>Admin</span>
                              <div style={{ background: '#3498db', padding: '12px 16px', borderRadius: '18px', borderBottomRightRadius: '4px', color: 'white', textAlign: 'left', fontSize: '14px', marginTop: '4px' }}>
                                {replyPiece}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Unified Message Input */}
                    <div style={{ padding: '20px', background: '#f8f9fa', borderTop: '1px solid #edf2f7' }}>
                      {(() => {
                        const partnerTkts = groupedPartnerTickets[expandedSupportEmail] || [];
                        const targetTicket = [...partnerTkts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="text"
                              placeholder="Type a message..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyPress={(e) => { if (e.key === 'Enter' && targetTicket) handleReplyTicket(targetTicket.id, targetTicket.adminReply); }}
                              style={{ flex: 1, padding: '15px 20px', borderRadius: '24px', border: '1px solid #dcdde1', outline: 'none', fontSize: '14px' }}
                            />
                            <button
                              onClick={() => { if (targetTicket) handleReplyTicket(targetTicket.id, targetTicket.adminReply); }}
                              style={{ background: '#3498db', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: 'white', transition: 'transform 0.1s' }}
                              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <Send size={20} style={{ marginLeft: '-2px', marginTop: '2px' }} />
                            </button>
                          </div>
                        );
                      })()}
                      {replySuccessMsg && <div style={{ color: '#2ed573', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>{replySuccessMsg}</div>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;
