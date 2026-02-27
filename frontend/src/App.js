import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3001/api';

// Configure axios to send cookies with all requests
axios.defaults.withCredentials = true;

// Helper to get cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function App() {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
    const userId = getCookie('userId');
    if (userId) {
      loadUser(userId);
      loadCart(userId);
    }
  }, []);

  // Reload user data periodically to keep credit updated
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        loadUser(user.id);
      }, 60000); // Refresh every 60 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUser = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/users/${userId}`);
      setUser(res.data);
    } catch (err) {
      console.error('Failed to load user');
    }
  };

  const loadProducts = async () => {
    const res = await axios.get(`${API_URL}/products?search=${searchQuery}`);
    setProducts(res.data);
  };

  const loadCart = async (userId) => {
    const res = await axios.get(`${API_URL}/cart/${userId}`);
    setCart(res.data);
  };

  return (
    <div className="app">
      <Header 
        user={user} 
        setPage={setPage} 
        setUser={setUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={loadProducts}
        cartCount={cart.length}
      />
      
      <main className="content">
        {page === 'home' && <HomePage products={products} user={user} setPage={setPage} />}
        {page === 'login' && <LoginPage setUser={setUser} setPage={setPage} loadCart={loadCart} />}
        {page === 'register' && <RegisterPage setPage={setPage} />}
        {page === 'product' && <ProductPage user={user} loadCart={loadCart} />}
        {page === 'cart' && <CartPage cart={cart} user={user} loadCart={loadCart} setPage={setPage} />}
        {page === 'profile' && <ProfilePage user={user} setUser={setUser} />}
        {page === 'orders' && <OrdersPage user={user} />}
        {page === 'admin' && <AdminPage user={user} />}
        {page === 'admin-feedback' && <AdminFeedbackPage user={user} />}
        {page === 'feedback' && <FeedbackPage user={user} />}
      </main>
    </div>
  );
}

function Header({ user, setPage, setUser, searchQuery, setSearchQuery, onSearch, cartCount }) {
  const handleLogout = async () => {
    await axios.post(`${API_URL}/auth/logout`);
    // Clear cookies
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    setPage('home');
    // Reload page to clear all state
    window.location.reload();
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo" onClick={() => setPage('home')}>🛒 VulnShop</h1>
        
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
          <button onClick={onSearch}>Search</button>
        </div>

        <nav className="nav">
          {user ? (
            <>
              {user.role !== 'admin' && (
                <>
                  <button onClick={() => setPage('cart')}>🛒 Cart ({cartCount})</button>
                  <button onClick={() => setPage('orders')}>📦 Orders</button>
                  <button onClick={() => setPage('feedback')}>💬 Feedback</button>
                </>
              )}
              <button onClick={() => setPage('profile')}>👤 {user.username}</button>
              {user.role === 'admin' && (
                <>
                  <button onClick={() => setPage('admin')}>⚙️ Admin</button>
                  <button onClick={() => setPage('admin-feedback')}>📝 View Feedbacks</button>
                </>
              )}
              <span className="credit">💰 ${user.credit?.toFixed(2)}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => setPage('login')}>Login</button>
              <button onClick={() => setPage('register')}>Register</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function HomePage({ products, user, setPage }) {
  return (
    <div className="home">
      <h2>Featured Products</h2>
      <div className="product-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} user={user} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, user }) {
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);

  const loadReviews = async () => {
    const res = await axios.get(`${API_URL}/products/${product.id}/reviews`);
    setReviews(res.data);
    setShowReviews(true);
  };

  const checkStockXML = async () => {
    try {
      const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?><stockCheck><productId>${product.id}</productId></stockCheck>`;
      
      const res = await axios.post(`${API_URL}/products/check-stock`, xmlRequest, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      
      alert(`Stock Check :\nProduct: ${product.name}\nStock: ${res.data.stock} units\nIn Stock: ${res.data.inStock ? 'Yes' : 'No'}`);
    } catch (err) {
      alert('Stock check failed: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  const addToCart = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }
    try {
      await axios.post(`${API_URL}/cart/${user.id}/add`, {
        productId: product.id,
        quantity: 1
      });
      alert('Added to cart!');
      window.location.reload(); // Reload to update cart count
    } catch (err) {
      alert('Failed to add to cart: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  return (
    <div className="product-card">
      <div className="product-image">📦</div>
      <h3>{product.name}</h3>
      <p className="product-desc">{product.description}</p>
      <p className="product-price">${product.price}</p>
      <p className="product-stock">Stock: {product.stock}</p>
      <button onClick={checkStockXML} className="stock-check-btn">Check Stock</button>
      <button onClick={addToCart} disabled={product.stock === 0}>
        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
      </button>
      <button onClick={loadReviews}>View Reviews</button>
      
      {showReviews && (
        <div className="reviews">
          <h4>Reviews</h4>
          {reviews.map(r => (
            <div key={r.id} className="review">
              <strong>{r.username}</strong> - ⭐{r.rating}/5
              <p dangerouslySetInnerHTML={{ __html: r.review }} />
            </div>
          ))}
          <ReviewForm productId={product.id} userId={user?.id} />
        </div>
      )}
    </div>
  );
}

function ReviewForm({ productId, userId }) {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);

  const submitReview = async () => {
    if (!userId) {
      alert('Please login first');
      return;
    }
    await axios.post(`${API_URL}/products/${productId}/review`, {
      userId,
      review,
      rating
    });
    alert('Review submitted!');
    setReview('');
  };

  return (
    <div className="review-form">
      <input 
        type="text" 
        placeholder="Write your review..." 
        value={review}
        onChange={(e) => setReview(e.target.value)}
      />
      <select value={rating} onChange={(e) => setRating(e.target.value)}>
        <option value="5">⭐⭐⭐⭐⭐</option>
        <option value="4">⭐⭐⭐⭐</option>
        <option value="3">⭐⭐⭐</option>
        <option value="2">⭐⭐</option>
        <option value="1">⭐</option>
      </select>
      <button onClick={submitReview}>Submit Review</button>
    </div>
  );
}

function LoginPage({ setUser, setPage, loadCart }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      
      if (res.data.requiresOtp) {
        setRequiresOtp(true);
        alert('OTP sent to your email');
      } else {
        setUser(res.data.user);
        loadCart(res.data.user.id);
        setPage('home');
      }
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  const handleOtpVerify = async () => {
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { username, otp });
      if (res.data.success) {
        setUser(res.data.user);
        loadCart(res.data.user.id);
        setPage('home');
      } else {
        alert('Invalid OTP');
      }
    } catch (err) {
      alert('OTP verification failed');
    }
  };

  return (
    <div className="form-page">
      <div className="form-container">
        <h2>Login</h2>
        {!requiresOtp ? (
          <>
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
            <button onClick={() => setPage('register')}>Register Instead</button>
            <ForgotPassword />
          </>
        ) : (
          <>
            <p>Enter OTP sent to your email</p>
            <input 
              type="text" 
              placeholder="OTP" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button onClick={handleOtpVerify}>Verify OTP</button>
          </>
        )}
      </div>
    </div>
  );
}

function ForgotPassword() {
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);

  const requestReset = async () => {
    await axios.post(`${API_URL}/auth/forgot-password`, { username });
    alert('Reset token sent to your email');
    setStep(2);
  };

  const resetPassword = async () => {
    await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword });
    alert('Password reset successful!');
    setShow(false);
  };

  return (
    <div>
      <button onClick={() => setShow(!show)}>Forgot Password?</button>
      {show && (
        <div className="forgot-password">
          {step === 1 ? (
            <>
              <input 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button onClick={requestReset}>Send Reset Token</button>
            </>
          ) : (
            <>
              <input 
                placeholder="Reset Token" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="New Password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button onClick={resetPassword}>Reset Password</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RegisterPage({ setPage }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      await axios.post(`${API_URL}/auth/register`, { username, password });
      alert('Registration successful! You can now login.');
      setPage('login');
    } catch (err) {
      alert('Registration failed');
    }
  };

  return (
    <div className="form-page">
      <div className="form-container">
        <h2>Register</h2>
        <input 
          type="text" 
          placeholder="Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleRegister}>Register</button>
        <button onClick={() => setPage('login')}>Login Instead</button>
      </div>
    </div>
  );
}

function CartPage({ cart, user, loadCart, setPage }) {
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotal = total * (1 - discount / 100);

  const applyCoupon = async () => {
    try {
      const res = await axios.post(`${API_URL}/cart/${user.id}/apply-coupon`, { couponCode });
      setDiscount(res.data.discount);
      alert(`Coupon applied! ${res.data.discount}% off`);
    } catch (err) {
      alert('Invalid coupon');
    }
  };

  const updateQuantity = async (productId, quantity) => {
    await axios.post(`${API_URL}/cart/${user.id}/update`, { productId, quantity });
    loadCart(user.id);
  };

  const checkout = async () => {
    try {
      const res = await axios.post(`${API_URL}/orders/${user.id}/checkout`);
      alert(`Order placed successfully! Order ID: ${res.data.orderId}`);
      loadCart(user.id);
      setPage('orders');
      window.location.reload(); // Reload to update credit
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Unknown error';
      if (err.response?.data?.required && err.response?.data?.available) {
        alert(`Checkout failed: ${errorMsg}\nRequired: $${err.response.data.required.toFixed(2)}\nYour balance: $${err.response.data.available.toFixed(2)}`);
      } else {
        alert('Checkout failed: ' + errorMsg);
      }
    }
  };

  return (
    <div className="cart-page">
      <h2>Shopping Cart</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div>
                  <h3>{item.name}</h3>
                  <p>${item.price}</p>
                </div>
                <div>
                  <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                  <button onClick={() => updateQuantity(item.product_id, 0)}>Remove</button>
                </div>
                <p>${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="coupon-section">
              <input 
                placeholder="Coupon code" 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button onClick={applyCoupon}>Apply</button>
            </div>
            
            <p>Subtotal: ${total.toFixed(2)}</p>
            {discount > 0 && <p>Discount: -{discount}%</p>}
            <h3>Total: ${finalTotal.toFixed(2)}</h3>
            <button className="checkout-btn" onClick={checkout}>Checkout</button>
          </div>
        </>
      )}
    </div>
  );
}

function ProfilePage({ user, setUser }) {
  const [newPassword, setNewPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);

  const changePassword = async () => {
    try {
      await axios.post(`${API_URL}/auth/change-password`, {
        username: user.username,
        oldPassword,
        newPassword
      });
      alert('Password changed successfully!');
    } catch (err) {
      alert('Failed to change password');
    }
  };

  const enableOtp = async () => {
    await axios.post(`${API_URL}/auth/enable-otp`, { email });
    alert('OTP enabled! You will receive OTP on this email during login.');
  };

  const updateAddress = async () => {
    try {
      // Send request with cookies (axios automatically includes cookies)
      await axios.post(`${API_URL}/users/${user.id}/address?data=${encodeURIComponent(address)}`, {}, {
        withCredentials: true
      });
      alert('Address updated!');
    } catch (err) {
      alert('Failed to update address: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  const uploadPhoto = async () => {
    const formData = new FormData();
    formData.append('file', profilePhoto);
    
    await axios.post(`${API_URL}/users/${user.id}/profile-photo`, formData);
    alert('Profile photo uploaded!');
    window.location.reload();
  };

  const requestCredit = async () => {
    await axios.post(`${API_URL}/users/${user.id}/credit-request`);
    alert('Credit request submitted!');
    window.location.reload();
  };

  return (
    <div className="profile-page">
      <h2>Profile</h2>
      
      <div className="profile-section">
        <h3>Account Info</h3>
        {user.profile_pic && (
          <div className="profile-photo-display">
            <p>Profile Photo:</p>
            <a 
              href={`http://localhost:3001/api/view-photo?photo=${user.profile_pic}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="photo-link"
            >
              View Profile Photo 
            </a>
            <p className="photo-line">                           </p>
            <img 
              src={`http://localhost:3001/api/view-photo?photo=${user.profile_pic}`} 
              alt="Profile" 
              style={{maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', marginTop: '10px'}}
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}
        <p>Username: {user.username}</p>
        <p>Email: {user.email || 'Not set'}</p>
        <p>Credit: ${user.credit?.toFixed(2)}</p>
        {user.role !== 'admin' && (
          <button onClick={requestCredit}>Request Credit Refill</button>
        )}
      </div>

      <div className="profile-section">
        <h3>Change Password</h3>
        <input 
          type="password" 
          placeholder="Old password" 
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="New password" 
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button onClick={changePassword}>Change Password</button>
      </div>

      <div className="profile-section">
        <h3>Enable 2FA (OTP)</h3>
        <input 
          type="email" 
          placeholder="Email for OTP" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={enableOtp}>Enable OTP</button>
      </div>

      <div className="profile-section">
        <h3>Address</h3>
        <input 
          type="text" 
          placeholder="Your address" 
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button onClick={updateAddress}>Update Address</button>
      </div>

      <div className="profile-section">
        <h3>Profile Photo</h3>
        <input 
          type="file" 
          onChange={(e) => setProfilePhoto(e.target.files[0])}
        />
        <button onClick={uploadPhoto}>Upload Photo</button>
      </div>
    </div>
  );
}

function OrdersPage({ user }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const res = await axios.get(`${API_URL}/orders/${user.id}`);
    setOrders(res.data);
  };

  return (
    <div className="orders-page">
      <h2>Order History</h2>
      {orders.map(order => (
        <div key={order.id} className="order">
          <p>Order #{order.id}</p>
          <p>Total: ${order.total_amount?.toFixed(2)}</p>
          <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
          <p>Status: {order.status}</p>
        </div>
      ))}
    </div>
  );
}

function FeedbackPage({ user }) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);

  const submitFeedback = async () => {
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('message', message);
    if (file) formData.append('file', file);

    await axios.post(`${API_URL}/feedback`, formData);
    alert('Feedback submitted!');
    setMessage('');
    setFile(null);
  };

  return (
    <div className="feedback-page">
      <h2>Submit Feedback</h2>
      
      <div className="feedback-form">
        <textarea 
          placeholder="Your feedback..." 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <input 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button onClick={submitFeedback}>Submit Feedback</button>
      </div>
    </div>
  );
}

function AdminPage({ user }) {
  const [refillUserId, setRefillUserId] = useState('');
  const [refillAmount, setRefillAmount] = useState('');
  const [commandOutput, setCommandOutput] = useState('');
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  if (user?.role !== 'admin') {
    return <div>Access denied</div>;
  }

  const refillCredit = async () => {
    await axios.post(`${API_URL}/admin/refill-credit`, {
      userId: refillUserId,
      amount: parseFloat(refillAmount)
    });
    alert('Credit refilled!');
  };

  const viewLogs = async () => {
    const res = await axios.post(`${API_URL}/admin/logs`, { 
      command: 'type access.log' 
    });
    setCommandOutput(res.data.output);
  };

  const configureSmtp = async () => {
    await axios.post(`${API_URL}/admin/smtp-config`, {
      server: smtpServer,
      port: parseInt(smtpPort),
      username: smtpUser,
      password: smtpPass
    });
    alert('SMTP configured!');
  };

  return (
    <div className="admin-page">
      <h2>Admin Panel</h2>

      <div className="admin-section">
        <h3>Refill User Credit</h3>
        <input 
          placeholder="User ID" 
          value={refillUserId}
          onChange={(e) => setRefillUserId(e.target.value)}
        />
        <input 
          placeholder="Amount" 
          type="number"
          value={refillAmount}
          onChange={(e) => setRefillAmount(e.target.value)}
        />
        <button onClick={refillCredit}>Refill Credit</button>
      </div>

      <div className="admin-section">
        <h3>View Logs</h3>
        <button onClick={viewLogs}>View Access Logs</button>
        <pre className="command-output">{commandOutput}</pre>
      </div>

      <div className="admin-section">
        <h3>Configure SMTP</h3>
        <input 
          placeholder="Server" 
          value={smtpServer}
          onChange={(e) => setSmtpServer(e.target.value)}
        />
        <input 
          placeholder="Port" 
          value={smtpPort}
          onChange={(e) => setSmtpPort(e.target.value)}
        />
        <input 
          placeholder="Username" 
          value={smtpUser}
          onChange={(e) => setSmtpUser(e.target.value)}
        />
        <input 
          placeholder="Password" 
          type="password"
          value={smtpPass}
          onChange={(e) => setSmtpPass(e.target.value)}
        />
        <button onClick={configureSmtp}>Configure</button>
      </div>
    </div>
  );
}

function AdminFeedbackPage({ user }) {
  const [feedbackList, setFeedbackList] = useState([]);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    const res = await axios.get(`${API_URL}/feedback`);
    setFeedbackList(res.data);
  };

  if (user?.role !== 'admin') {
    return <div className="feedback-page"><h2>Access denied</h2></div>;
  }

  return (
    <div className="feedback-page">
      <h2>User Feedbacks</h2>      
      <div className="feedback-list">
        {feedbackList.length === 0 ? (
          <p>No feedbacks submitted yet.</p>
        ) : (
          feedbackList.map(fb => (
            <div key={fb.id} className="feedback-item">
              <div className="feedback-header">
                <strong>👤 {fb.username}</strong>
                <span className="feedback-date">{new Date(fb.created_at).toLocaleString()}</span>
              </div>
              {/* VULN: dangerouslySetInnerHTML allows XSS */}
              <div 
                className="feedback-content" 
                dangerouslySetInnerHTML={{ __html: fb.message }}
              />
              {fb.file_path && (
                <div className="feedback-attachment">
                  📎 Attachment: <a href={`http://localhost:3001/uploads/feedback/${fb.file_path}`} target="_blank" rel="noopener noreferrer">{fb.file_path}</a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
