const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const xml2js = require('xml2js');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3001;

// ⚠️ WARNING: This is a DELIBERATELY VULNERABLE application for security training
// DO NOT deploy this in production or on public networks

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'application/xml' }));
app.use(cookieParser());
app.use(express.static('public'));

// Create necessary directories
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const profileDir = path.join(uploadsDir, 'profile');
const feedbackDir = path.join(uploadsDir, 'feedback');
const gitDir = path.join(__dirname, 'public', '.git');
const dependenciesDir = path.join(__dirname, 'public', 'dependencies');

[uploadsDir, profileDir, feedbackDir, gitDir, dependenciesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});


fs.writeFileSync(path.join(gitDir, 'HEAD'), 'ref: refs/heads/main\n');
fs.writeFileSync(path.join(gitDir, 'config'), '[core]\n\trepositoryformatversion = 0\n\t[user]\n\tname = admin\n\temail = admin@vulnerable-shop.com\n');
const gitLogs = `commit a1b2c3d4e5f6 - Added database password: db_pass_2024_secure!\ncommit f6e5d4c3b2a1 - Fixed API key leak: sk-prod-abc123xyz789\ncommit 1234567890ab - Removed hardcoded AWS credentials\n`;
fs.writeFileSync(path.join(gitDir, 'logs.txt'), gitLogs);

// Create dependencies directory content
fs.writeFileSync(path.join(dependenciesDir, 'package-lock.json'), '{"name": "vulnerable-shop", "dependencies": {}}');


fs.writeFileSync(path.join(__dirname, 'public', 'robots.txt'), 'User-agent: *\nDisallow: /admin/\nDisallow: /dependencies/\n# Hidden directory: /dependencies/ contains sensitive files\n');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.path.includes('profile-photo')) {
      cb(null, profileDir);
    } else {
      cb(null, feedbackDir);
    }
  },
  filename: (req, file, cb) => {

    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,

  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(null, true); 
    }
  }
});

// Database connection
const db = new sqlite3.Database(path.join(__dirname, '../database/ecommerce.db'));

// SMTP transporter (configured by admin)
let smtpConfig = null;
let transporter = null;

// Load SMTP config from database
db.get('SELECT * FROM smtp_config WHERE id = 1', (err, row) => {
  if (row) {
    smtpConfig = row;
    transporter = nodemailer.createTransport({
      host: row.server,
      port: row.port,
      auth: {
        user: row.username,
        pass: row.password
      }
    });
  }
});

function checkAuth(req, res, next) {
  const authToken = req.cookies.authToken;
  const userId = req.cookies.userId;
  
  if (!authToken || !userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    
    const expectedToken = crypto.createHash('sha1').update(user.password).digest('hex');
    
    if (authToken !== expectedToken) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    
    req.user = user; // Attach user to request
    next();
  });
}

const loginAttempts = {};
const blacklistedIPs = {};

function rateLimitLogin(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Check if IP is blacklisted
  if (blacklistedIPs[ip]) {
    const timeLeft = Math.ceil((blacklistedIPs[ip] - Date.now()) / 1000);
    if (timeLeft > 0) {
      return res.status(403).json({ 
        error: 'IP address temporarily blocked due to too many failed login attempts',
        blockedFor: timeLeft,
        message: `Try again in ${timeLeft} seconds`
      });
    } else {
      // Blacklist expired
      delete blacklistedIPs[ip];
      delete loginAttempts[ip];
    }
  }
  
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { count: 0, resetTime: Date.now() + 60000 };
  }
  
  const attempt = loginAttempts[ip];
  
  // Reset after 1 minute
  if (Date.now() > attempt.resetTime) {
    attempt.count = 0;
    attempt.resetTime = Date.now() + 60000;
  }
  
  if (attempt.count >= 5) {
    // Blacklist the IP for 5 minutes
    blacklistedIPs[ip] = Date.now() + (5 * 60 * 1000); // 5 minutes
    console.log(`🚫 IP ${ip} blacklisted for 5 minutes due to brute force attempt`);
    
    return res.status(403).json({ 
      error: 'Too many failed login attempts. IP address blocked for 5 minutes.',
      blockedUntil: new Date(blacklistedIPs[ip]).toISOString()
    });
  }
  
  attempt.count++;
  next();
}

// Helper function to send email
function sendEmail(to, subject, text) {
  // Always log to console for testing
  console.log('\n📧 ===== EMAIL SENT =====');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Body:', text);
  console.log('========================\n');
  
  if (!transporter) {
    console.log('⚠️ SMTP not configured. Email logged above for testing.');
    return;
  }
  transporter.sendMail({ from: smtpConfig.username, to, subject, text }, (err) => {
    if (err) console.error('Email error:', err);
  });
}

// ==================== AUTHENTICATION ENDPOINTS ====================

app.post('/api/auth/login', rateLimitLogin, (req, res) => {
  const { username, password } = req.body;
  
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  
  db.get(query, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (user) {
      const authToken = crypto.createHash('sha1').update(password).digest('hex');
      res.cookie('authToken', authToken, { httpOnly: false }); 
      res.cookie('userId', user.id); 
      
      if (user.otp_enabled) {
        // Generate 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        db.run('INSERT INTO otp (user_id, otp) VALUES (?, ?)', [user.id, otp]);
        
        sendEmail(user.email, 'Your OTP Code', `Your OTP is: ${otp}`);
        
        return res.json({ requiresOtp: true, userId: user.id });
      }
      
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
  
      setTimeout(() => {
        res.status(401).json({ error: 'Invalid credentials' });
      }, Math.random() * 100);
    }
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { username, otp } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    db.get('SELECT * FROM otp WHERE otp = ? ORDER BY created_at DESC LIMIT 1', [otp], (err, otpRecord) => {
      if (otpRecord) {
        const password = user.password;
        const authToken = crypto.createHash('sha1').update(password).digest('hex');
        res.cookie('authToken', authToken, { httpOnly: false });
        res.cookie('userId', user.id);
        
        res.json({ success: true, valid: true, user: { id: user.id, username: user.username, role: user.role } });
      } else {
        res.json({ success: false, valid: false });
      }
    });
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT role FROM users WHERE username = ?', [username], (err, existingUser) => {
    const role = existingUser?.role || 'customer';
    
    db.run('DELETE FROM users WHERE username = ?', [username], () => {
      db.run('INSERT INTO users (username, password, role, credit) VALUES (?, ?, ?, 100.0)', 
        [username, password, role], 
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Registration failed' });
          }
          res.json({ success: true, userId: this.lastID, role: role });
        }
      );
    });
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

app.post('/api/auth/change-password', (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, oldPassword], (err, user) => {
    if (user) {
      db.run('UPDATE users SET password = ? WHERE id = ?', [newPassword, user.id], () => {
        res.json({ success: true });
      });
    } else {
      res.status(401).json({ error: 'Invalid old password' });
    }
  });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { username } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (user) {
      const token = crypto.randomBytes(8).toString('hex');
      
      db.run('INSERT INTO reset_tokens (user_id, token) VALUES (?, ?)', [user.id, token]);
      
      sendEmail(user.email, 'Password Reset', `Your reset token: ${token}`);
      
      setTimeout(() => {
        res.json({ success: true, message: 'Reset token sent' });
      }, 500);
    } else {
      res.json({ success: true, message: 'Reset token sent' });
    }
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  
  db.get('SELECT * FROM reset_tokens WHERE token = ?', [token], (err, resetToken) => {
    if (resetToken) {
      const userId = req.body.userId || resetToken.user_id;
      
      db.run('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId], () => {
        res.json({ success: true });
      });
    } else {
      res.status(400).json({ error: 'Invalid token' });
    }
  });
});

// Enable OTP
app.post('/api/auth/enable-otp', (req, res) => {
  const { email } = req.body;
  const userId = req.cookies.userId;
  
  db.run('UPDATE users SET otp_enabled = 1, email = ? WHERE id = ?', [email, userId], () => {
    res.json({ success: true });
  });
});

// ==================== USER ENDPOINTS ====================

app.get('/api/users/:userId', checkAuth, (req, res) => {
  const userId = req.params.userId;
  
  db.get('SELECT id, username, email, profile_pic, otp_enabled, role, credit FROM users WHERE id = ?', 
    [userId], (err, user) => {
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }
  );
});

app.put('/api/users/:userId', checkAuth, (req, res) => {
  const userId = req.params.userId;
  const { email, address, credit } = req.body;
  
  const updates = [];
  const values = [];
  
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    values.push(address);
  }
  if (credit !== undefined) {
    updates.push('credit = ?');
    values.push(credit);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  values.push(userId);
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Update failed' });
    }
    res.json({ success: true, changes: this.changes });
  });
});

// PATCH method (partial update) - same as PUT
app.patch('/api/users/:userId', checkAuth, (req, res) => {
  const userId = req.params.userId;
  const { email, address, credit } = req.body;
  
  const updates = [];
  const values = [];
  
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    values.push(address);
  }
  if (credit !== undefined) {
    updates.push('credit = ?');
    values.push(credit);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  values.push(userId);
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Update failed' });
    }
    res.json({ success: true, changes: this.changes });
  });
});

app.post('/api/users/:userId/address', checkAuth, (req, res) => {
  const userId = req.params.userId;
  const authToken = req.cookies.authToken;
  
  // Check if user is authenticated
  if (!authToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  db.run('UPDATE users SET address = ? WHERE id = ?', [address, userId], () => {
    res.json({ success: true });
  });
});

app.post('/api/users/:userId/profile-photo', checkAuth, upload.single('file'), (req, res) => {
  const userId = req.params.userId;
  const filename = req.file.filename;
  
  db.run('UPDATE users SET profile_pic = ? WHERE id = ?', [filename, userId], () => {
    res.json({ success: true, filename });
  });
});

app.get('/api/users/:userId/wallet', checkAuth, (req, res) => {
  const userId = req.params.userId;
  
  db.get('SELECT credit FROM users WHERE id = ?', [userId], (err, user) => {
    res.json({ credit: user.credit });
  });
});

app.post('/api/users/:userId/credit-request', checkAuth, (req, res) => {
  const userId = req.params.userId;
  
  db.run('UPDATE users SET credit = credit + 100 WHERE id = ?', [userId], () => {
    res.json({ success: true, message: 'Credit added' });
  });
});

// ==================== PRODUCT ENDPOINTS ====================

// List products with search
app.get('/api/products', (req, res) => {
  const search = req.query.search || '';
  
  const query = `SELECT * FROM products WHERE name LIKE '%${search}%' OR description LIKE '%${search}%'`;
  
  db.all(query, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(products);
  });
});

// Get product details
app.get('/api/products/:productId', (req, res) => {
  const productId = req.params.productId;
  
  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });
});

app.put('/api/products/:productId', checkAuth, (req, res) => {
  const productId = req.params.productId;
  const { name, description, price, stock } = req.body;
  
  const updates = [];
  const values = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (price !== undefined) {
    updates.push('price = ?');
    values.push(price);
  }
  if (stock !== undefined) {
    updates.push('stock = ?');
    values.push(stock);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  values.push(productId);
  const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Update failed' });
    }
    res.json({ success: true, changes: this.changes });
  });
});

// PATCH method for products
app.patch('/api/products/:productId', checkAuth, (req, res) => {
  const productId = req.params.productId;
  const { name, description, price, stock } = req.body;
  
  const updates = [];
  const values = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (price !== undefined) {
    updates.push('price = ?');
    values.push(price);
  }
  if (stock !== undefined) {
    updates.push('stock = ?');
    values.push(stock);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  values.push(productId);
  const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Update failed' });
    }
    res.json({ success: true, changes: this.changes });
  });
});

app.post('/api/products/check-stock', (req, res) => {
  const xmlData = req.body;
  
  const parser = new xml2js.Parser({
    explicitArray: false,
  });
  
  // xml2js doesn't support external entities, so we'll use raw XML parsing
  
  try {
    if (xmlData.includes('<!DOCTYPE') || xmlData.includes('<!ENTITY')) {
      const entityMatch = xmlData.match(/SYSTEM\s+["']([^"']+)["']/);
      if (entityMatch && entityMatch[1]) {
        const entityUrl = entityMatch[1];
        
        if (entityUrl.startsWith('file://') || entityUrl.startsWith('/')) {
          const filePath = entityUrl.replace('file://', '');
          try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return res.json({ 
              productId: '',
              stock: 0,
              inStock: false,
              Data: fileContent,
              expType: ''
            });
          } catch (err) {
            return res.json({
              productId: '',
              stock: 0,
              inStock: false,
              error: 'err',
              attemptedPath: filePath
            });
          }
        } else if (entityUrl.startsWith('http://') || entityUrl.startsWith('https://')) {
          const http = require('http');
          const https = require('https');
          const url = require('url');
          
          const parsedUrl = url.parse(entityUrl);
          const protocol = parsedUrl.protocol === 'https:' ? https : http;
          
          protocol.get(entityUrl, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
              data += chunk;
            });
            
            response.on('end', () => {
              res.json({
                productId: '',
                stock: 0,
                inStock: false,
                Data: data,
                expType: '',
                targetUrl: entityUrl,
                statusCode: response.statusCode
              });
            });
          }).on('error', (err) => {
            res.json({
              productId: '',
              stock: 0,
              inStock: false,
              error: ' request failed: ' + err.message,
              attemptedUrl: entityUrl
            });
          });
          
          return; // Don't continue to normal processing
        }
      }
    }
    
    // Normal stock check processing
    parser.parseString(xmlData, (err, result) => {
      if (err) {
        return res.status(400).json({ error: 'Invalid XML' });
      }
      
      try {
        const productId = result.stockCheck.productId;
        
        db.get('SELECT stock FROM products WHERE id = ?', [productId], (err, product) => {
          if (product) {
            res.json({ productId, stock: product.stock, inStock: product.stock > 0 });
          } else {
            res.status(404).json({ error: 'Product not found' });
          }
        });
      } catch (e) {
        res.status(400).json({ error: 'Invalid request' });
      }
    });
  } catch (e) {
    res.status(400).json({ error: 'XML processing error' });
  }
});

app.get('/api/products/:productId/stock', (req, res) => {
  const productId = req.params.productId;
  
  db.get('SELECT stock, name FROM products WHERE id = ?', [productId], (err, product) => {
    if (product) {
      res.json({ 
        productId, 
        name: product.name,
        stock: product.stock, 
        inStock: product.stock > 0 
      });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });
});

app.get('/api/products/image', (req, res) => {
  const filename = req.query.file;
  
  if (!filename) {
    return res.status(400).json({ error: 'Filename required' });
  }
  
  const filepath = path.join(__dirname, 'public', 'images', filename);
  
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

app.get('/api/view-photo', (req, res) => {
  const photo = req.query.photo;
  
  if (!photo) {
    return res.status(400).json({ error: 'Photo parameter required' });
  }
  
  const photoPath = path.join(__dirname, 'public', 'uploads', 'profile', photo);
  
  if (fs.existsSync(photoPath)) {
    const ext = path.extname(photoPath).toLowerCase();
    
    // Set content type based on extension
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    const content = fs.readFileSync(photoPath);
    res.send(content);
  } else {
    res.status(404).send('Photo not found');
  }
});

app.get('/api/products/image', (req, res) => {
  const filename = req.query.file;
  
  const filepath = path.join(__dirname, 'public', 'images', filename);
  
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// ==================== CART ENDPOINTS ====================

app.post('/api/cart/:userId/add', checkAuth, (req, res) => {
  const userId = req.params.userId;
  const { productId, quantity } = req.body;
  
  db.run(`INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)
          ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + ?`,
    [userId, productId, quantity, quantity], () => {
      res.json({ success: true });
    }
  );
});

app.get('/api/cart/:userId', checkAuth, (req, res) => {
  const userId = req.params.userId;
  
  db.all(`SELECT c.*, p.name, p.price, p.image 
          FROM cart c 
          JOIN products p ON c.product_id = p.id 
          WHERE c.user_id = ?`, [userId], (err, items) => {
    res.json(items || []);
  });
});

app.post('/api/cart/:userId/update', checkAuth, (req, res) => {
  const userId = req.params.userId;
  const { productId, quantity } = req.body;
  
  if (quantity === 0) {
    db.run('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [userId, productId]);
  } else {
    db.run('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?', 
      [quantity, userId, productId]);
  }
  res.json({ success: true });
});

app.post('/api/cart/:userId/apply-coupon', checkAuth, (req, res) => {
  const { couponCode } = req.body;
  
  db.get('SELECT * FROM coupons WHERE code = ?', [couponCode], (err, coupon) => {
    if (coupon) {
      res.json({ success: true, discount: coupon.discount_percent });
    } else {
      res.status(404).json({ error: 'Invalid coupon' });
    }
  });
});

// ==================== ORDER ENDPOINTS ====================

app.post('/api/orders/:userId/checkout', checkAuth, (req, res) => {
  const userId = req.params.userId;
  
  db.all('SELECT * FROM cart WHERE user_id = ?', [userId], (err, cartItems) => {
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    let total = 0;
    const promises = cartItems.map(item => {
      return new Promise((resolve) => {
        db.get('SELECT * FROM products WHERE id = ?', [item.product_id], (err, product) => {
          total += product.price * item.quantity;
          resolve({ item, product });
        });
      });
    });
    
    Promise.all(promises).then(results => {
      // Get user's current credit
      db.get('SELECT credit FROM users WHERE id = ?', [userId], (err, user) => {
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Check credit balance
        if (user.credit < total) {
          return res.status(400).json({ 
            error: 'Insufficient credit', 
            required: total, 
            available: user.credit 
          });
        }
        
        let stockError = null;
        for (const { item, product } of results) {
          if (product.stock < item.quantity) {
            stockError = `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`;
            break;
          }
        }
        
        if (stockError) {
          return res.status(400).json({ error: stockError });
        }
        
        db.run('INSERT INTO orders (user_id, total_amount) VALUES (?, ?)', 
          [userId, total], function() {
            const orderId = this.lastID;
            
            results.forEach(({ item, product }) => {
              db.run('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, product.price]);
              
              // Update stock
              db.run('UPDATE products SET stock = stock - ? WHERE id = ?', 
                [item.quantity, item.product_id]);
            });
            
            db.run('UPDATE users SET credit = credit - ? WHERE id = ?', [total, userId]);
            db.run('DELETE FROM cart WHERE user_id = ?', [userId]);
            
            res.json({ success: true, orderId, total });
          }
        );
      });
    });
  });
});

app.get('/api/orders/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, orders) => {
    res.json(orders || []);
  });
});

// ==================== REVIEW ENDPOINTS ====================

app.post('/api/products/:productId/review', (req, res) => {
  const productId = req.params.productId;
  const { userId, review, rating } = req.body;
  
  db.run('INSERT INTO reviews (product_id, user_id, review, rating) VALUES (?, ?, ?, ?)',
    [productId, userId, review, rating], () => {
      res.json({ success: true });
    }
  );
});

app.get('/api/products/:productId/reviews', (req, res) => {
  const productId = req.params.productId;
  
  db.all(`SELECT r.*, u.username FROM reviews r 
          JOIN users u ON r.user_id = u.id 
          WHERE r.product_id = ?`, [productId], (err, reviews) => {
    res.json(reviews || []);
  });
});

// ==================== FEEDBACK ENDPOINT ====================

app.post('/api/feedback', upload.single('file'), (req, res) => {
  const { userId, message } = req.body;
  const filePath = req.file ? req.file.filename : null;
  
  db.run('INSERT INTO feedback (user_id, message, file_path) VALUES (?, ?, ?)',
    [userId, message, filePath], () => {
      res.json({ success: true });
    }
  );
});

app.get('/api/feedback', (req, res) => {
  db.all('SELECT f.*, u.username FROM feedback f JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC', 
    (err, feedback) => {
      res.json(feedback || []);
    }
  );
});

// ==================== ADMIN ENDPOINTS ====================

app.post('/api/admin/refill-credit', (req, res) => {
  const { userId, amount } = req.body;
  
  db.run('UPDATE users SET credit = credit + ? WHERE id = ?', [amount, userId], () => {
    res.json({ success: true });
  });
});

app.post('/api/admin/logs', (req, res) => {
  const { command } = req.body;
  
  exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
    res.json({ output: stdout || stderr || 'Command executed' });
  });
});

app.get('/api/files', (req, res) => {
  const requestedPath = req.query.path || '/';
  
  const fullPath = path.join(__dirname, 'public', requestedPath);
  
  try {
    const files = fs.readdirSync(fullPath);
    const fileList = files.map(file => {
      const stats = fs.statSync(path.join(fullPath, file));
      return {
        name: file,
        isDirectory: stats.isDirectory(),
        size: stats.size
      };
    });
    res.json({ path: requestedPath, files: fileList });
  } catch (e) {
    res.status(404).json({ error: 'Path not found' });
  }
});

app.post('/api/admin/smtp-config', (req, res) => {
  const { server, port, username, password } = req.body;
  
  db.run(`INSERT OR REPLACE INTO smtp_config (id, server, port, username, password) 
          VALUES (1, ?, ?, ?, ?)`, [server, port, username, password], () => {
    smtpConfig = { server, port, username, password };
    transporter = nodemailer.createTransport({
      host: server,
      port: port,
      auth: { user: username, pass: password }
    });
    res.json({ success: true });
  });
});

app.get('/api/admin/server-stats', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform
  });
});

// ==================== METRICS ENDPOINT (SSRF TARGET) ====================

app.get('/metrics', (req, res) => {
  const authKey = req.headers['x-internal-auth-key'];
  
  if (authKey === 'secret_metric_key_12345') {
    res.json({
      internal: true,
      secret_key: 'sk-internal-metrics-2024',
      database_password: 'db_admin_pass_2024',
      api_keys: {
        stripe: 'sk_live_abc123xyz789',
        aws: 'AKIAIOSFODNN7EXAMPLE'
      },
      api_metrics: {
        requests: 12847,
        errors: 234
      },
      internal_endpoints: [
        '/api/admin/server-stats',
        '/metrics',
        '/.git',
        '/version',
        '/health'
      ]
    });
  } else {
    res.status(403).json({ 
      error: 'Forbidden - Missing or invalid authentication header'
    });
  }
});

app.use((req, res, next) => {
  if (req.method === 'TRACE') {
    res.set('X-Secret-Header-Name', 'X-Internal-Auth-Key');
    res.set('X-Secret-Header-Value', 'secret_metric_key_12345');
    res.set('X-Hint', 'Use X-Internal-Auth-Key header to access /metrics endpoint');
    
    const traceResponse = `TRACE ${req.url} HTTP/1.1
Headers:
${JSON.stringify(req.headers, null, 2)}

Secret Headers Discovered:
- X-Internal-Auth-Key: secret_metric_key_12345

Hint: Use this header to access protected endpoints like /metrics
`;
    
    res.send(traceResponse);
  } else {
    next();
  }
});

// ==================== PUBLIC ENDPOINTS ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/version', (req, res) => {
  res.json({ version: '1.0.0', name: 'Vulnerable E-Commerce Platform' });
});

app.use('/uploads', express.static(uploadsDir), (req, res, next) => {
  const reqPath = path.join(uploadsDir, req.path);
  if (fs.existsSync(reqPath) && fs.statSync(reqPath).isDirectory()) {
    const files = fs.readdirSync(reqPath);
    res.send(`
      <h1>Directory Listing: ${req.path}</h1>
      <ul>
        ${files.map(f => `<li><a href="${req.path}/${f}">${f}</a></li>`).join('')}
      </ul>
    `);
  } else {
    next();
  }
});

app.use('/.git', express.static(gitDir));

fs.writeFileSync(path.join(__dirname, 'access.log'), 
  `192.168.1.100 - - [${new Date().toISOString()}] "GET /api/products HTTP/1.1" 200 1234\n` +
  `192.168.1.101 - - [${new Date().toISOString()}] "POST /api/auth/login HTTP/1.1" 200 567\n` +
  `192.168.1.102 - admin [${new Date().toISOString()}] "GET /api/admin/logs HTTP/1.1" 200 890\n` +
  `192.168.1.103 - - [${new Date().toISOString()}] "GET /api/products/1 HTTP/1.1" 200 450\n` +
  `192.168.1.104 - user1 [${new Date().toISOString()}] "POST /api/cart/2/add HTTP/1.1" 200 123\n`
);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('\n🚨 ================================== 🚨');
  console.log('⚠️  VULNERABLE E-COMMERCE PLATFORM  ⚠️');
  console.log('🚨 ================================== 🚨\n');
  console.log('⚠️  WARNING: This application is INTENTIONALLY INSECURE');
  console.log('⚠️  FOR SECURITY TRAINING PURPOSES ONLY');
  console.log('⚠️  DO NOT deploy on public networks or use in production\n');
  console.log(`🔗 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Default admin: admin/admin\n`);
  console.log('📚 See README.md for vulnerability documentation\n');
});
