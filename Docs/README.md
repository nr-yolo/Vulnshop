# 🚨 VulnShop - Deliberately Vulnerable E-Commerce Platform

## ⚠️ CRITICAL WARNING

**THIS APPLICATION IS INTENTIONALLY INSECURE AND CONTAINS SERIOUS SECURITY VULNERABILITIES**

- **DO NOT** deploy this application on public networks
- **DO NOT** use in production environments
- **DO NOT** store real user data
- **ONLY** use in isolated, controlled environments for security training

This application is designed **exclusively** for:
- Security training and education
- Penetration testing practice
- Vulnerability assessment learning
- Security awareness demonstrations

---

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Default Credentials](#default-credentials)
- [Implemented Vulnerabilities](#implemented-vulnerabilities)
- [API Documentation](#api-documentation)
- [Learning Resources](#learning-resources)

---

## ✨ Features

### User Features
- User registration and authentication
- Product browsing and search
- Shopping cart management
- Order placement and history
- Product reviews
- Wallet/credit system
- Profile management
- Two-factor authentication (OTP)
- Feedback submission with file uploads

### Admin Features
- Credit management for users
- Log viewer with command execution
- SMTP configuration
- File browser
- Server statistics

---

## 🔧 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQLite3

---

## 📦 Installation

### 1. Clone or Download the Project

```bash
cd vulnerable-ecommerce
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Initialize Database

```bash
npm run init-db
```

You should see:
```
✅ Database initialized successfully!
📊 Sample data inserted
🔐 Admin credentials: admin/admin
```

### 4. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## 🚀 Running the Application

### Start Backend Server

```bash
cd backend
npm start
```

The API server will start on `http://localhost:3001`

### Start Frontend Development Server

Open a new terminal:

```bash
cd frontend
npm start
```

The application will open in your browser at `http://localhost:3000`

---

## 🔐 Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin`

**New Users:**
- Register to create a new account
- Each new user receives $100 credit automatically

---

## 🐛 Implemented Vulnerabilities

This application contains **40+ intentional security vulnerabilities** across multiple categories:

### 🔓 Authentication & Session Management (13 vulnerabilities)

1. **SQL Injection in Login** - Login endpoint vulnerable to SQL injection bypass
   - Endpoint: `POST /api/auth/login`
   - Example payload: `username: admin' OR '1'='1' --`

2. **Session Persistence After Logout** - Auth cookies not invalidated on logout
   - Endpoint: `POST /api/auth/logout`
   - Cookie remains valid after logout

3. **Weak Session Tokens** - Session token is SHA1 hash of password
   - Predictable and crackable
   - Cookie name: `authToken`

4. **Username Enumeration** - Different timing for valid/invalid users
   - Endpoint: `POST /api/auth/forgot-password`
   - Timing attack reveals user existence

5. **Username Overwrite via Re-registration** - Can overwrite existing accounts
   - Endpoint: `POST /api/auth/register`
   - Register with existing username to hijack account

6. **Password Brute Force** - No rate limiting on password change
   - Endpoint: `POST /api/auth/change-password`
   - Can brute force old password

7. **OTP Brute Force** - 4-digit OTP with no timeout or rate limit
   - Endpoint: `POST /api/auth/verify-otp`
   - Can brute force 0000-9999

8. **OTP Bypass** - Invalid OTP accepted if response manipulated
   - Endpoint: `POST /api/auth/verify-otp`
   - Intercept response and change `valid: false` to `valid: true`

9. **2FA Bypass** - Can use another user's OTP
   - No user-OTP binding validation
   - Any valid OTP works for any user

10. **Forgot Password Token Reuse** - Reset tokens work across users
    - Endpoint: `POST /api/auth/reset-password`
    - Token from user A can reset password for user B

11. **Password Reset Link Hijacking** - Can reset other accounts
    - Include `userId` in reset request to target different user

12. **Brute Force Protection Bypass** - X-Forwarded-For header manipulation
    - Add `X-Forwarded-For` header to bypass IP-based rate limiting

13. **No CSRF Protection** - State-changing operations lack CSRF tokens

### 🪪 IDOR (Insecure Direct Object Reference) (5 vulnerabilities)

14. **User Profile IDOR** - Access any user's profile
    - Endpoint: `GET /api/users/{userId}`
    - Change userId to access other profiles

15. **Wallet Manipulation** - View/modify any user's wallet
    - Endpoint: `GET /api/users/{userId}/wallet`
    - Endpoint: `POST /api/users/{userId}/credit-request`

16. **Cart Manipulation** - Modify any user's cart
    - Endpoint: `POST /api/cart/{userId}/add`
    - Endpoint: `POST /api/cart/{userId}/update`

17. **Order Access** - View any user's order history
    - Endpoint: `GET /api/orders/{userId}`

18. **Address Update IDOR** - Update any user's address
    - Endpoint: `POST /api/users/{userId}/address`

### 💉 Injection Vulnerabilities (4 vulnerabilities)

19. **SQL Injection in Search** - Product search vulnerable to SQLi
    - Endpoint: `GET /api/products?search=`
    - Example: `search=' OR '1'='1' --`

20. **Command Injection** - Admin logs viewer executes arbitrary commands
    - Endpoint: `POST /api/admin/logs`
    - Example: `command: cat access.log; whoami`

21. **XXE (XML External Entity)** - Stock check parses XML unsafely
    - Endpoint: `POST /api/products/check-stock`
    - Can read local files or perform SSRF

22. **Stored XSS** - Feedback and reviews stored without sanitization
    - Endpoint: `POST /api/feedback`
    - Payload: `<script>alert('XSS')</script>`

### 📂 Path Traversal & Information Disclosure (7 vulnerabilities)

23. **Path Traversal in Image Loading**
    - Endpoint: `GET /api/products/image?file=`
    - Example: `file=../../../etc/passwd`

24. **Directory Listing Enabled** - Uploads directory browsable
    - URL: `http://localhost:3001/uploads/profile/`

25. **Exposed .git Directory** - Contains commit history and secrets
    - URL: `http://localhost:3001/.git/`
    - Contains database passwords and API keys in commit messages

26. **robots.txt Information Leak** - Reveals sensitive directories
    - URL: `http://localhost:3001/robots.txt`
    - Lists `/dependencies/` directory

27. **Exposed Dependencies** - Package files publicly accessible
    - URL: `http://localhost:3001/dependencies/`

28. **File Browser** - Admin file browser with path traversal
    - Endpoint: `GET /api/files?path=`

29. **Unauthenticated Server Stats** - Internal metrics exposed
    - Endpoint: `GET /api/admin/server-stats`
    - No authentication required

### 📤 File Upload Vulnerabilities (3 vulnerabilities)

30. **Content-Type Bypass** - Only validates Content-Type header
    - Endpoint: `POST /api/users/{userId}/profile-photo`
    - Endpoint: `POST /api/feedback`
    - Spoof MIME type to upload malicious files

31. **Weak Magic Byte Check** - Insufficient file signature validation

32. **Extension Blacklist** - Uses blacklist instead of whitelist
    - Can upload PHP, JSP, or other executable files

### 🌐 SSRF & XXE (2 vulnerabilities)

33. **Internal Metrics Endpoint** - Accessible via SSRF
    - Endpoint: `GET /metrics`
    - Only accessible from localhost
    - Use XXE or other SSRF to access

34. **XXE to SSRF** - Chain XXE vulnerability to access internal services
    - Use stock check XXE to make requests to `/metrics`

### 🔧 HTTP Method & Headers (2 vulnerabilities)

35. **TRACE Method Enabled** - Reveals secret headers
    - Method: `TRACE /api/admin/server-stats`
    - Exposes `X-Internal-Auth-Key` header

36. **Custom Header Disclosure** - Secret header revealed via TRACE

### 💼 Business Logic Flaws (4 vulnerabilities)

37. **Credit Manipulation** - Users can add their own credits
    - Endpoint: `POST /api/users/{userId}/credit-request`
    - Auto-approves credit additions

38. **Stock Bypass** - Can purchase out-of-stock items
    - Endpoint: `POST /api/orders/{userId}/checkout`
    - No stock validation during checkout

39. **Insufficient Funds Bypass** - Can checkout without enough credits
    - No balance validation before order placement

40. **Sequential Predictable IDs** - All resources use sequential IDs
    - Easy enumeration of users, products, orders

### 🛡️ CSRF (1 vulnerability)

41. **CSRF on Address Update** - No CSRF token validation
    - Endpoint: `POST /api/users/{userId}/address?data=`
    - Vulnerable to cross-site request forgery

---

## 🎯 Vulnerability Testing Guide

### Testing SQL Injection

**Login Bypass:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1'\'' --","password":"anything"}'
```

**Search SQLi:**
```
http://localhost:3001/api/products?search=' UNION SELECT 1,2,3,4,5,6 --
```

### Testing IDOR

**Access Other User's Profile:**
```bash
curl http://localhost:3001/api/users/2
```

**Manipulate Other User's Cart:**
```bash
curl -X POST http://localhost:3001/api/cart/2/add \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":1}'
```

### Testing XXE

**Stock Check XXE:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE stockCheck [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<stockCheck>
  <productId>&xxe;</productId>
</stockCheck>
```

**XXE to SSRF:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE stockCheck [
  <!ENTITY xxe SYSTEM "http://localhost:3001/metrics">
]>
<stockCheck>
  <productId>&xxe;</productId>
</stockCheck>
```

### Testing Path Traversal

**Image Path Traversal:**
```
http://localhost:3001/api/products/image?file=../../../../etc/passwd
```

**File Browser Traversal:**
```
http://localhost:3001/api/files?path=../../../
```

### Testing XSS

**Stored XSS in Feedback:**
```bash
curl -X POST http://localhost:3001/api/feedback \
  -F "userId=1" \
  -F "message=<script>alert('XSS')</script>"
```

### Testing Command Injection

**Admin Logs Command Injection:**
```bash
curl -X POST http://localhost:3001/api/admin/logs \
  -H "Content-Type: application/json" \
  -d '{"command":"cat access.log; ls -la"}'
```

### Testing OTP Bypass

1. Enable OTP for a user
2. Trigger OTP generation
3. Intercept the verify OTP response
4. Change `"valid": false` to `"valid": true` in the response

### Testing TRACE Method

```bash
curl -X TRACE http://localhost:3001/api/admin/server-stats
```

---

## 📚 API Documentation

### Authentication

| Endpoint | Method | Description | Vulnerability |
|----------|--------|-------------|---------------|
| `/api/auth/login` | POST | User login | SQL Injection |
| `/api/auth/register` | POST | User registration | Username overwrite |
| `/api/auth/logout` | POST | User logout | Session not invalidated |
| `/api/auth/change-password` | POST | Change password | Brute force |
| `/api/auth/forgot-password` | POST | Request password reset | User enumeration |
| `/api/auth/reset-password` | POST | Reset password | Token reuse |
| `/api/auth/enable-otp` | POST | Enable 2FA | - |
| `/api/auth/verify-otp` | POST | Verify OTP | Brute force, bypass |

### Users

| Endpoint | Method | Description | Vulnerability |
|----------|--------|-------------|---------------|
| `/api/users/:userId` | GET | Get user profile | IDOR |
| `/api/users/:userId/address` | POST | Update address | IDOR, CSRF |
| `/api/users/:userId/profile-photo` | POST | Upload photo | File upload |
| `/api/users/:userId/wallet` | GET | Get wallet balance | IDOR |
| `/api/users/:userId/credit-request` | POST | Request credit | IDOR, Logic flaw |

### Products

| Endpoint | Method | Description | Vulnerability |
|----------|--------|-------------|---------------|
| `/api/products` | GET | List products | SQL Injection |
| `/api/products/:id` | GET | Get product | - |
| `/api/products/check-stock` | POST | Check stock (XML) | XXE |
| `/api/products/image` | GET | Load image | Path traversal |
| `/api/products/:id/review` | POST | Add review | Stored XSS |

### Cart & Orders

| Endpoint | Method | Description | Vulnerability |
|----------|--------|-------------|---------------|
| `/api/cart/:userId/add` | POST | Add to cart | IDOR |
| `/api/cart/:userId` | GET | View cart | IDOR |
| `/api/cart/:userId/update` | POST | Update cart | IDOR |
| `/api/cart/:userId/apply-coupon` | POST | Apply coupon | - |
| `/api/orders/:userId/checkout` | POST | Checkout | Stock bypass |
| `/api/orders/:userId` | GET | Order history | IDOR |

### Feedback

| Endpoint | Method | Description | Vulnerability |
|----------|--------|-------------|---------------|
| `/api/feedback` | POST | Submit feedback | XSS, File upload |
| `/api/feedback` | GET | View feedback | - |

### Admin

| Endpoint | Method | Description | Vulnerability |
|----------|--------|-------------|---------------|
| `/api/admin/refill-credit` | POST | Refill user credit | - |
| `/api/admin/logs` | POST | View logs | Command injection |
| `/api/admin/smtp-config` | POST | Configure SMTP | - |
| `/api/admin/server-stats` | GET | Server statistics | No auth |
| `/api/files` | GET | File browser | Path traversal |

### Internal

| Endpoint | Method | Description | Vulnerability |
|----------|--------|-------------|---------------|
| `/metrics` | GET | Internal metrics | SSRF target |
| `/health` | GET | Health check | - |
| `/version` | GET | Version info | - |

---

## 🎓 Learning Resources

### OWASP Top 10 Mapping

This application demonstrates vulnerabilities from the OWASP Top 10:

1. **A01:2021 – Broken Access Control**: IDOR vulnerabilities
2. **A02:2021 – Cryptographic Failures**: Weak password hashing (SHA1)
3. **A03:2021 – Injection**: SQL Injection, Command Injection, XXE
4. **A04:2021 – Insecure Design**: Business logic flaws
5. **A05:2021 – Security Misconfiguration**: Directory listing, exposed files
6. **A06:2021 – Vulnerable Components**: Intentionally outdated patterns
7. **A07:2021 – Identification and Authentication Failures**: Multiple auth issues
8. **A08:2021 – Software and Data Integrity Failures**: No CSRF protection
9. **A09:2021 – Security Logging and Monitoring Failures**: Inadequate logging
10. **A10:2021 – Server-Side Request Forgery**: XXE to SSRF

### Recommended Practice Order

1. **Beginners**: Start with IDOR and SQL Injection
2. **Intermediate**: Move to XSS, Command Injection, and File Upload
3. **Advanced**: Try XXE, SSRF chains, and business logic flaws

### Additional Resources

- OWASP Web Security Testing Guide
- PortSwigger Web Security Academy
- HackerOne Hacktivity (real vulnerability reports)
- Bug Bounty Platforms (HackerOne, Bugcrowd)

---

## 🛠️ Troubleshooting

### Database Issues

If you encounter database errors:
```bash
cd backend
rm -rf ../database/ecommerce.db
npm run init-db
```

### Port Conflicts

If ports 3000 or 3001 are in use:
- Backend: Edit `server.js` and change PORT variable
- Frontend: Create `.env` file with `PORT=3002`

### CORS Errors

Make sure both backend and frontend are running on localhost. The backend has CORS enabled for all origins in development.

---

## ⚖️ Legal Disclaimer

This software is provided for **educational purposes only**. The creators and contributors are not responsible for any misuse or damage caused by this application. Users must:

- Only use in controlled, isolated environments
- Not deploy on public networks
- Not store real user data
- Comply with all applicable laws and regulations
- Use only for authorized security testing

By using this application, you agree to these terms and understand the risks involved.

---

## 🤝 Contributing

This is a training tool. If you find additional vulnerability patterns that would be educational to include, contributions are welcome. Please ensure:

- Vulnerabilities are well-documented
- Code is clearly commented
- Educational value is explained

---

## 📝 License

This project is released under MIT License for educational purposes only.

---

## 🙏 Acknowledgments

Inspired by:
- DVWA (Damn Vulnerable Web Application)
- WebGoat (OWASP)
- Juice Shop (OWASP)
- Other intentionally vulnerable applications for security training

---

**Remember: This application is a learning tool. Always practice ethical hacking and responsible disclosure!**
