const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(path.join(dbDir, 'ecommerce.db'));

// Initialize database schema
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    role TEXT DEFAULT 'customer',
    credit REAL DEFAULT 100.0,
    profile_pic TEXT,
    address TEXT,
    otp_enabled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price REAL,
    stock INTEGER,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total_amount REAL,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Order items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL
  )`);

  // Cart table
  db.run(`CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    UNIQUE(user_id, product_id)
  )`);

  // Reviews table
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    user_id INTEGER,
    rating INTEGER,
    review TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Feedback table
  db.run(`CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Coupons table
  db.run(`CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    discount_percent REAL
  )`);

  // Password reset tokens table
  db.run(`CREATE TABLE IF NOT EXISTS reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // OTP table
  db.run(`CREATE TABLE IF NOT EXISTS otp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    otp TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // SMTP config table
  db.run(`CREATE TABLE IF NOT EXISTS smtp_config (
    id INTEGER PRIMARY KEY,
    server TEXT,
    port INTEGER,
    username TEXT,
    password TEXT
  )`);

  // Logs table
  db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default admin user (password: admin)
  const adminPassword = 'admin';
  const adminPasswordHash = crypto.createHash('sha1').update(adminPassword).digest('hex');
  
  db.run(`INSERT OR IGNORE INTO users (id, username, password, role, credit) 
          VALUES (1, 'admin', ?, 'admin', 10000.0)`, [adminPassword]);

  // Insert sample products
  const products = [
    ['Laptop Pro 15"', 'High-performance laptop with 16GB RAM', 999.99, 10, 'laptop.jpg'],
    ['Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 29.99, 50, 'mouse.jpg'],
    ['Mechanical Keyboard', 'RGB mechanical keyboard with cherry switches', 149.99, 25, 'keyboard.jpg'],
    ['USB-C Hub', '7-in-1 USB-C hub with HDMI and ethernet', 49.99, 30, 'usbhub.jpg'],
    ['Webcam HD', '1080p webcam with auto-focus', 79.99, 15, 'webcam.jpg'],
    ['Monitor 27"', '4K monitor with HDR support', 399.99, 8, 'monitor.jpg'],
    ['Headphones Pro', 'Noise-cancelling wireless headphones', 199.99, 20, 'headphones.jpg'],
    ['Phone Stand', 'Adjustable aluminum phone stand', 19.99, 100, 'phonestand.jpg'],
    ['External SSD 1TB', 'Portable SSD with 1000MB/s read speed', 129.99, 12, 'ssd.jpg'],
    ['Desk Lamp LED', 'Adjustable LED desk lamp with touch control', 39.99, 40, 'lamp.jpg']
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO products (name, description, price, stock, image) VALUES (?, ?, ?, ?, ?)');
  products.forEach(product => stmt.run(product));
  stmt.finalize();

  // Insert sample coupons
  db.run(`INSERT OR IGNORE INTO coupons (code, discount_percent) VALUES ('SAVE10', 10.0)`);
  db.run(`INSERT OR IGNORE INTO coupons (code, discount_percent) VALUES ('SAVE20', 20.0)`);
  db.run(`INSERT OR IGNORE INTO coupons (code, discount_percent) VALUES ('WELCOME', 15.0)`);

  // Insert some sample logs
  db.run(`INSERT INTO logs (message) VALUES ('Application started')`);
  db.run(`INSERT INTO logs (message) VALUES ('Admin user logged in')`);
  db.run(`INSERT INTO logs (message) VALUES ('Product catalog accessed')`);
});

db.close(() => {
  console.log('✅ Database initialized successfully!');
  console.log('📊 Sample data inserted');
  console.log('🔐 Admin credentials: admin/admin');
});
