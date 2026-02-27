# 🔒 VulnShop - Security Solutions Guide

This document explains how to properly fix each vulnerability in the application.

---

## 🔐 Authentication & Session Management Fixes

### 1. SQL Injection in Login

**Vulnerable Code:**
```javascript
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
db.get(query, (err, user) => { ... });
```

**Secure Fix:**
```javascript
const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
db.get(query, [username, password], (err, user) => { ... });
```

**Key Concepts:**
- Use parameterized queries (prepared statements)
- Never concatenate user input into SQL queries
- Input validation as defense-in-depth (not primary protection)

### 2. Session Persistence After Logout

**Vulnerable Code:**
```javascript
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});
```

**Secure Fix:**
```javascript
// Use session store (e.g., express-session with Redis)
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie('authToken');
    res.clearCookie('userId');
    res.json({ success: true });
  });
});
```

**Key Concepts:**
- Clear cookies on logout
- Invalidate session server-side
- Use session store to track valid sessions
- Set session expiration times

### 3. Weak Session Tokens (SHA1 of Password)

**Vulnerable Code:**
```javascript
const authToken = crypto.createHash('sha1').update(password).digest('hex');
res.cookie('authToken', authToken, { httpOnly: false });
```

**Secure Fix:**
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // No JavaScript access
    maxAge: 3600000, // 1 hour
    sameSite: 'strict'
  }
}));

// In login
req.session.userId = user.id;
req.session.role = user.role;
```

**Key Concepts:**
- Use cryptographically secure random tokens
- Store sessions server-side
- Use httpOnly and secure cookies
- Implement session expiration
- Never hash password for session token

### 4. Username Overwrite via Re-registration

**Vulnerable Code:**
```javascript
db.run('DELETE FROM users WHERE username = ?', [username], () => {
  db.run('INSERT INTO users (username, password, credit) VALUES (?, ?, 100.0)', 
    [username, password]);
});
```

**Secure Fix:**
```javascript
db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
  if (user) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  
  db.run('INSERT INTO users (username, password, credit) VALUES (?, ?, 100.0)', 
    [username, password], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Registration failed' });
      }
      res.json({ success: true });
    });
});
```

**Key Concepts:**
- Check for existing username before insertion
- Use UNIQUE constraint on username column
- Validate input before database operations

### 5-6. Password Brute Force & OTP Brute Force

**Secure Fix:**
```javascript
const rateLimit = require('express-rate-limit');

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many password attempts, please try again later'
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: 'Too many OTP attempts, please try again later'
});

app.post('/api/auth/change-password', passwordLimiter, (req, res) => { ... });
app.post('/api/auth/verify-otp', otpLimiter, (req, res) => { ... });
```

**Additional OTP Protections:**
```javascript
// Use 6-digit OTP minimum
const otp = Math.floor(100000 + Math.random() * 900000).toString();

// Set expiration
const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
db.run('INSERT INTO otp (user_id, otp, expires_at) VALUES (?, ?, ?)', 
  [userId, otp, expiresAt]);

// Verify expiration and bind to user
db.get('SELECT * FROM otp WHERE user_id = ? AND otp = ? AND expires_at > ?', 
  [userId, otp, Date.now()], (err, record) => {
    if (record) {
      // Delete OTP after use
      db.run('DELETE FROM otp WHERE id = ?', [record.id]);
      // Proceed with login
    }
  });
```

**Key Concepts:**
- Implement rate limiting
- Use account lockout after failed attempts
- Add CAPTCHA after several failures
- Log suspicious activity
- Use 6+ digit OTPs
- Set OTP expiration
- Delete OTP after successful use
- Bind OTP to specific user

### 7. OTP Response Manipulation

**Vulnerable Code:**
```javascript
if (otpRecord) {
  res.json({ success: true, valid: true, user: {...} });
} else {
  res.json({ success: false, valid: false });
}
```

**Secure Fix:**
```javascript
// Verify server-side, don't trust client
db.get('SELECT * FROM otp WHERE user_id = ? AND otp = ? AND expires_at > ?', 
  [userId, otp, Date.now()], (err, record) => {
    if (!record) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }
    
    // Set server-side session
    req.session.userId = userId;
    req.session.otpVerified = true;
    
    res.json({ success: true, redirect: '/dashboard' });
  });
```

**Key Concepts:**
- Never rely on client-side validation
- Set session state server-side
- Don't send sensitive boolean flags to client
- Use proper HTTP status codes

### 8. Password Reset Token Reuse

**Vulnerable Code:**
```javascript
db.get('SELECT * FROM reset_tokens WHERE token = ?', [token], (err, resetToken) => {
  const userId = req.body.userId || resetToken.user_id;
  db.run('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
});
```

**Secure Fix:**
```javascript
db.get('SELECT * FROM reset_tokens WHERE token = ? AND expires_at > ?', 
  [token, Date.now()], (err, resetToken) => {
    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // CRITICAL: Only use the userId from the token
    const userId = resetToken.user_id;
    
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], () => {
      // Delete token after use
      db.run('DELETE FROM reset_tokens WHERE id = ?', [resetToken.id]);
      res.json({ success: true });
    });
  });
```

**Key Concepts:**
- Tokens should be single-use
- Tokens should expire (15-30 minutes)
- Never accept userId from client
- Delete token after successful use
- Use cryptographically secure tokens

### 9. User Enumeration

**Vulnerable Code:**
```javascript
db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
  if (user) {
    setTimeout(() => res.json({ success: true }), 500);
  } else {
    res.json({ success: true }); // Different timing
  }
});
```

**Secure Fix:**
```javascript
db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
  // Always same response and timing
  if (user) {
    sendResetEmail(user.email, token);
  }
  
  // Use constant-time response
  setTimeout(() => {
    res.json({ 
      success: true, 
      message: 'If the username exists, a reset email has been sent' 
    });
  }, 500 + Math.random() * 200);
});
```

**Key Concepts:**
- Use constant-time responses
- Generic error messages
- Same response for valid/invalid cases
- Add random jitter to timing

---

## 🪪 IDOR (Access Control) Fixes

### General IDOR Fix Pattern

**Vulnerable Code:**
```javascript
app.get('/api/users/:userId', (req, res) => {
  const userId = req.params.userId;
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    res.json(user);
  });
});
```

**Secure Fix:**
```javascript
// Middleware to verify authentication
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Middleware to verify authorization
function requireOwnership(req, res, next) {
  const requestedUserId = parseInt(req.params.userId);
  const currentUserId = req.session.userId;
  
  if (requestedUserId !== currentUserId && req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

app.get('/api/users/:userId', requireAuth, requireOwnership, (req, res) => {
  const userId = req.params.userId;
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    res.json(user);
  });
});
```

**Key Concepts:**
- Implement authentication (who you are)
- Implement authorization (what you can access)
- Verify ownership of resources
- Use middleware for reusable checks
- Check permissions on every request
- Use session data, never trust client input

---

## 💉 Injection Vulnerability Fixes

### 1. Command Injection

**Vulnerable Code:**
```javascript
exec(command, (error, stdout, stderr) => {
  res.json({ output: stdout });
});
```

**Secure Fix:**
```javascript
// Option 1: Whitelist allowed commands
const allowedCommands = {
  'access.log': () => fs.readFileSync('access.log', 'utf8'),
  'error.log': () => fs.readFileSync('error.log', 'utf8')
};

app.post('/api/admin/logs', (req, res) => {
  const logType = req.body.logType;
  
  if (!allowedCommands[logType]) {
    return res.status(400).json({ error: 'Invalid log type' });
  }
  
  try {
    const content = allowedCommands[logType]();
    res.json({ output: content });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read log' });
  }
});

// Option 2: If command execution is necessary, use execFile with strict args
const { execFile } = require('child_process');

execFile('cat', ['access.log'], (error, stdout, stderr) => {
  res.json({ output: stdout });
});
```

**Key Concepts:**
- Avoid system command execution when possible
- Use file system APIs instead
- Whitelist allowed operations
- Never concatenate user input into commands
- Use `execFile` instead of `exec`
- Validate and sanitize all inputs

### 2. XXE (XML External Entity)

**Vulnerable Code:**
```javascript
const parser = new xml2js.Parser({
  // External entities enabled by default
});
```

**Secure Fix:**
```javascript
const xml2js = require('xml2js');

const parser = new xml2js.Parser({
  explicitArray: false,
  // Disable external entities
  xmlns: false,
  // Use secure defaults
  strict: true,
  // Don't resolve external entities
  resolveExternalEntities: false,
  // Don't process entities
  processEntities: false
});

// Alternative: Use JSON instead of XML
app.post('/api/products/check-stock', (req, res) => {
  const { productId } = req.body; // Expect JSON
  // ... validation and processing
});
```

**Key Concepts:**
- Disable external entity processing
- Use less complex data formats (JSON)
- Validate XML structure
- Use XML schema validation
- Keep XML libraries updated

### 3. XSS (Cross-Site Scripting)

**Vulnerable Code:**
```javascript
<p dangerouslySetInnerHTML={{ __html: review }} />
```

**Secure Fix - Backend:**
```javascript
const sanitizeHtml = require('sanitize-html');

app.post('/api/feedback', (req, res) => {
  const message = sanitizeHtml(req.body.message, {
    allowedTags: [], // No HTML allowed
    allowedAttributes: {}
  });
  
  db.run('INSERT INTO feedback (user_id, message) VALUES (?, ?)', 
    [userId, message]);
});
```

**Secure Fix - Frontend:**
```javascript
// Option 1: Use textContent (React does this by default)
<p>{review}</p>

// Option 2: If HTML is needed, use DOMPurify
import DOMPurify from 'dompurify';

<p dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(review) 
}} />
```

**Key Concepts:**
- Encode output by default
- Sanitize input on server-side
- Use Content Security Policy (CSP)
- Avoid innerHTML and dangerouslySetInnerHTML
- Use frameworks that auto-escape (React default behavior)

---

## 📂 Path Traversal Fixes

**Vulnerable Code:**
```javascript
const filepath = path.join(__dirname, 'public', 'images', filename);
```

**Secure Fix:**
```javascript
const path = require('path');

app.get('/api/products/image', (req, res) => {
  const filename = req.query.file;
  
  // Validate filename
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  // Use whitelist of allowed files
  const allowedImages = ['laptop.jpg', 'mouse.jpg', 'keyboard.jpg'];
  if (!allowedImages.includes(filename)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Resolve path and verify it's within allowed directory
  const imagesDir = path.join(__dirname, 'public', 'images');
  const filepath = path.resolve(imagesDir, filename);
  
  if (!filepath.startsWith(imagesDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.sendFile(filepath);
});
```

**Key Concepts:**
- Validate and sanitize file paths
- Use whitelist of allowed files
- Resolve absolute paths and check they're within bounds
- Reject path traversal characters (../, ..\, etc.)
- Use database IDs instead of filenames when possible

---

## 📤 File Upload Fixes

**Vulnerable Code:**
```javascript
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, true); // Still accepts!
    }
  }
});
```

**Secure Fix:**
```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Whitelist of allowed MIME types
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    // Generate random filename
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = ALLOWED_TYPES[file.mimetype];
    cb(null, `${randomName}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Check MIME type
    if (!ALLOWED_TYPES[file.mimetype]) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});

// Additional: Verify file content (magic bytes)
const fileType = require('file-type');

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Verify actual file type
  const type = await fileType.fromFile(req.file.path);
  
  if (!type || !ALLOWED_TYPES[type.mime]) {
    fs.unlinkSync(req.file.path); // Delete file
    return res.status(400).json({ error: 'Invalid file content' });
  }
  
  res.json({ success: true, filename: req.file.filename });
});
```

**Key Concepts:**
- Use whitelist for file types
- Verify both MIME type and magic bytes
- Generate random filenames
- Store files outside web root
- Set file size limits
- Scan files for malware
- Use separate domain for user uploads

---

## 🛡️ CSRF Protection

**Vulnerable Code:**
```javascript
app.post('/api/users/:userId/address', (req, res) => {
  const address = req.query.data;
  db.run('UPDATE users SET address = ? WHERE id = ?', [address, userId]);
});
```

**Secure Fix:**
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

// Send CSRF token to frontend
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Protect state-changing operations
app.post('/api/users/:userId/address', requireAuth, requireOwnership, (req, res) => {
  const address = req.body.address; // Use POST body, not query param
  const userId = req.session.userId; // Use session, not param
  
  db.run('UPDATE users SET address = ? WHERE id = ?', [address, userId], () => {
    res.json({ success: true });
  });
});
```

**Frontend:**
```javascript
// Get CSRF token
const { csrfToken } = await fetch('/api/csrf-token').then(r => r.json());

// Include in requests
fetch('/api/users/1/address', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({ address: 'New Address' })
});
```

**Key Concepts:**
- Use CSRF tokens for state-changing operations
- Verify tokens server-side
- Use SameSite cookie attribute
- Don't use GET for state changes
- Require authentication for sensitive operations

---

## 🔒 General Security Best Practices

### 1. Password Storage

**Never Store Plaintext:**
```javascript
const bcrypt = require('bcrypt');

// Registration
const hashedPassword = await bcrypt.hash(password, 10);
db.run('INSERT INTO users (username, password) VALUES (?, ?)', 
  [username, hashedPassword]);

// Login
const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
const match = await bcrypt.compare(password, user.password);
```

### 2. HTTPS Only

```javascript
// Force HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

// Secure cookies
app.use(session({
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true,
    sameSite: 'strict'
  }
}));
```

### 3. Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  }
}));
```

### 4. Input Validation

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/auth/register',
  body('username').isAlphanumeric().isLength({ min: 3, max: 20 }),
  body('password').isLength({ min: 8 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process registration
  }
);
```

### 5. Logging & Monitoring

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log security events
logger.warn('Failed login attempt', { username, ip: req.ip });
logger.error('SQL injection attempt', { query, ip: req.ip });
```

---

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

Remember: **Security is not a feature, it's a process.** Continuous learning, testing, and improvement are essential.
