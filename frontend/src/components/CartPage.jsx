import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Minus, Trash2, Package } from 'lucide-react';

function CartPage({ cart, setCart, userProfile, showToast }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerName: userProfile?.name || '',
    customerContact: '',
    deliveryAddress: '',
    customerEmail: userProfile?.email || ''
  });
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleIncrease = (item) => {
    setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
  };

  const handleDecrease = (item) => {
    if (item.quantity === 1) {
      setCart(cart.filter(c => c.id !== item.id));
    } else {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c));
    }
  };

  const [selectedCheckoutItem, setSelectedCheckoutItem] = useState(null);

  const [selectedAddress, setSelectedAddress] = useState(null);

  const confirmOrder = () => {
    if (!selectedAddress) {
      showToast("Please select a delivery address first.");
      return;
    }
    setLoading(true);

    const orderPayload = {
      customerName: userProfile?.name || JSON.parse(localStorage.getItem('user'))?.name || 'Guest',
      customerContact: selectedAddress.contact,
      customerEmail: userProfile?.email || JSON.parse(localStorage.getItem('user'))?.email || '',
      deliveryAddress: selectedAddress.loc,
      franchiseId: selectedCheckoutItem.franchiseId,
      foodItemIds: Array(selectedCheckoutItem.quantity).fill(selectedCheckoutItem.id).join(','),
      totalAmount: selectedCheckoutItem.price * selectedCheckoutItem.quantity
    };

    setTimeout(() => {
      axios.post('http://localhost:8081/api/orders/checkout', orderPayload)
        .then(response => {
          setCart(cart.filter(c => c.id !== selectedCheckoutItem.id));
          setLoading(false);
          setSelectedCheckoutItem(null);
          setSelectedAddress(null);
          showToast(`Payment successful! Order placed for ${selectedCheckoutItem.name} 🎉`);
        })
        .catch(error => {
          console.error("Error placing order:", error);
          showToast("Failed to place order.");
          setLoading(false);
        });
    }, 1500);
  };

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h2>Your Shopping Cart</h2>
        <p>Review your items and complete checkout.</p>
      </div>
      
      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is looking a little empty! Go add some delicious food!</p>
          <button className="btn-primary mt-4" onClick={() => navigate('/user/home')} style={{width: 'auto'}}>Browse Menu</button>
        </div>
      ) : (
        <div className="cart-content-modern" style={{display: 'flex', gap: '30px', alignItems: 'flex-start'}}>
          
          <div className="cart-items-list" style={{flex: 2}}>
            <h3 className="section-subtitle">Items in Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})</h3>
            <div className="cart-list-container">
              {cart.map((item, idx) => (
                <div key={idx} className="cart-list-item" style={{display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', border: selectedCheckoutItem?.id === item.id ? '2px solid var(--primary)' : '1px solid #edf2f7'}}>
                  <div style={{display: 'flex', gap: '20px', width: '100%', alignItems: 'center'}}>
                    <div className="item-img-wrapper" style={{width: '100px', height: '100px', flexShrink: 0}}>
                      <img src={item.imageUrl || "https://via.placeholder.com/100"} alt={item.name} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px'}}/>
                    </div>
                    <div className="item-details-wrapper" style={{flex: 1}}>
                      <h4 style={{fontSize: '1.2rem'}}>{item.name}</h4>
                      <p className="item-desc" style={{margin: '5px 0 10px 0'}}>{item.description || 'Delicious freshly prepared dish.'}</p>
                      <div className="quantity-controls" style={{marginTop: 'auto'}}>
                        <button type="button" className="qty-btn" onClick={() => handleDecrease(item)}>
                          {item.quantity === 1 ? <Trash2 size={14} color="#ff4757" /> : <Minus size={14} />}
                        </button>
                        <span className="qty-count">{item.quantity}</span>
                        <button type="button" className="qty-btn" onClick={() => handleIncrease(item)}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="item-price-wrapper" style={{textAlign: 'right'}}>
                      <span className="price-tag-modern" style={{fontSize: '1.4rem'}}>₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                  <div style={{borderTop: '1px solid #edf2f7', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end'}}>
                    <button 
                      className="btn-primary" 
                      onClick={() => { 
                        if (selectedCheckoutItem?.id === item.id) {
                          setSelectedCheckoutItem(null);
                          setSelectedAddress(null);
                        } else {
                          setSelectedCheckoutItem(item);
                          setSelectedAddress(null);
                        }
                      }}
                      style={{width: 'auto', padding: '10px 24px', fontSize: '1rem', borderRadius: '30px', background: selectedCheckoutItem?.id === item.id ? '#2ed573' : 'var(--primary)'}}
                    >
                      {selectedCheckoutItem?.id === item.id ? '✓ Selected (Click to Unselect)' : `Buy This Now (₹${item.price * item.quantity})`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="checkout-sidebar" style={{flex: 1, position: 'sticky', top: '20px', background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
            {!selectedCheckoutItem ? (
               <div style={{textAlign: 'center', padding: '40px 20px', color: '#747d8c'}}>
                 <Package size={48} color="#dcdde1" style={{marginBottom: '15px', margin: '0 auto'}}/>
                 <h3>Ready to Checkout?</h3>
                 <p>Click <strong>"Buy This Now"</strong> on any item in your cart to select a delivery address and place your order.</p>
               </div>
            ) : (
               <div>
                 <h3 style={{marginBottom: '15px', borderBottom: '2px solid #edf2f7', paddingBottom: '10px'}}>Complete Your Order</h3>
                 
                 <div style={{display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px'}}>
                   <img src={selectedCheckoutItem.imageUrl || "https://via.placeholder.com/60"} alt={selectedCheckoutItem.name} style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px'}} />
                   <div>
                     <h4 style={{margin: '0 0 5px 0', fontSize: '1.1rem'}}>{selectedCheckoutItem.name} (x{selectedCheckoutItem.quantity})</h4>
                     <h3 style={{color: 'var(--primary)', margin: 0}}>Total: ₹{selectedCheckoutItem.price * selectedCheckoutItem.quantity}</h3>
                   </div>
                 </div>

                 <h4 style={{marginBottom: '10px'}}>Select Delivery Address</h4>
                 {userProfile?.addresses?.length > 0 ? (
                   <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', paddingRight: '5px'}}>
                     {userProfile.addresses.map((addr, idx) => (
                       <div 
                         key={idx} 
                         style={{
                           cursor: 'pointer', 
                           border: selectedAddress === addr ? '2px solid var(--primary)' : '2px solid #edf2f7', 
                           background: selectedAddress === addr ? 'rgba(255, 107, 107, 0.05)' : 'white',
                           padding: '15px', 
                           borderRadius: '8px',
                           transition: 'all 0.2s ease'
                         }} 
                         onClick={() => setSelectedAddress(addr)}
                       >
                         <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                           <h5 style={{margin: 0, fontSize: '1rem'}}>{addr.name}</h5>
                           {selectedAddress === addr && <span style={{color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem'}}>✓ Selected</span>}
                         </div>
                         <p style={{margin: '0 0 5px 0', fontSize: '0.85rem', color: '#2f3640'}}>{addr.loc}</p>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div style={{padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px'}}>
                     <p style={{fontSize: '0.9rem', color: '#747d8c', marginBottom: '10px'}}>No saved addresses found.</p>
                     <button className="btn-secondary" style={{padding: '8px', fontSize: '0.9rem'}} onClick={() => navigate('/user/account')}>Add in Profile</button>
                   </div>
                 )}

                 <button 
                   className="btn-primary" 
                   onClick={confirmOrder}
                   disabled={loading || !selectedAddress}
                   style={{width: '100%', padding: '15px', fontSize: '1.1rem', borderRadius: '30px'}}
                 >
                   {loading ? "Processing Payment..." : `Pay ₹${selectedCheckoutItem.price * selectedCheckoutItem.quantity} & Place Order`}
                 </button>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
