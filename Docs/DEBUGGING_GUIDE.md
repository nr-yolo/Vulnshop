# 🔧 Debugging Guide - Version 1.5 Issues

## Issue #1: Re-registering Admin Creates Low Privilege User

### Expected Behavior
When re-registering the "admin" username, the admin role should be preserved.

### Step-by-Step Test

**1. Check current admin account:**
```bash
# Start servers first
cd backend && npm start
# In another terminal:
cd frontend && npm start

# Test login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -v

# Should return success with userId=1
```

**2. Check admin role:**
```bash
# Login first to get cookie
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -c cookies.txt

# Check user details
curl http://localhost:3001/api/users/1 -b cookies.txt

# Response should show: "role":"admin"
```

**3. Re-register admin with new password:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"newpassword"}' \
  -v

# IMPORTANT: Check the response!
# Should include: "role":"admin"
```

**4. Verify admin role persisted:**
```bash
# Login with new password
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"newpassword"}' \
  -c cookies2.txt

# Check user details again
curl http://localhost:3001/api/users/1 -b cookies2.txt

# Response should STILL show: "role":"admin"
```

### If It's Not Working

**Check backend console:**
```bash
# The server should log something when registration happens
# Look for any errors in the terminal where you ran: cd backend && npm start
```

**Check database directly:**
```bash
cd database
sqlite3 ecommerce.db

# Check admin user
SELECT id, username, role FROM users WHERE username='admin';

# Should show role='admin', not 'customer'
```

**Manual fix if needed:**
```bash
cd database
sqlite3 ecommerce.db
UPDATE users SET role='admin' WHERE username='admin';
.quit
```

---

## Issue #2: PUT/PATCH Methods Not Working

### Expected Behavior
PUT and PATCH requests should update user and product data.

### Step-by-Step Test

**1. Verify server is running:**
```bash
curl http://localhost:3001/api/products

# Should return list of products
```

**2. Test PUT method on users:**
```bash
# Login first
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -c cookies.txt \
  -v

# Try PUT request
curl -X PUT http://localhost:3001/api/users/2 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"credit":999999}' \
  -v

# Check response status code - should be 200
# Response should be: {"success":true,"changes":1}
```

**3. Verify the change:**
```bash
curl http://localhost:3001/api/users/2 -b cookies.txt

# Should show credit: 999999
```

**4. Test PATCH method:**
```bash
curl -X PATCH http://localhost:3001/api/users/2 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"email":"test@example.com"}' \
  -v

# Should return: {"success":true,"changes":1}
```

**5. Test on products:**
```bash
curl -X PUT http://localhost:3001/api/products/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"price":0.01}' \
  -v

# Should return: {"success":true,"changes":1}

# Verify
curl http://localhost:3001/api/products/1

# Should show price: 0.01
```

### If It's Not Working

**Check CORS:**
```bash
# The server response should include CORS headers
# Run with -v flag and look for:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

**Test with OPTIONS:**
```bash
curl -X OPTIONS http://localhost:3001/api/users/2 -v

# Should return 200 OK with allowed methods
```

**Check if endpoints exist:**
```bash
cd backend
grep -n "app.put" server.js
grep -n "app.patch" server.js

# Should show line numbers where PUT/PATCH are defined
```

**Try with Postman or Insomnia:**
1. Open Postman
2. Create new request
3. Method: PUT
4. URL: http://localhost:3001/api/users/2
5. Headers: Content-Type: application/json
6. Body: {"credit": 999999}
7. Send

If it works in Postman but not curl, check curl version:
```bash
curl --version
# Should be 7.x or higher
```

---

## Issue #3: XSS in Admin Feedback Not Working

### Expected Behavior
When submitting `<script>alert('XSS')</script>` in feedback, it should execute when admin views it.

### Step-by-Step Test

**1. Submit XSS payload:**

Via curl:
```bash
curl -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: multipart/form-data" \
  -F "userId=2" \
  -F "message=<script>alert('XSS Test')</script>" \
  -v

# Should return: {"success":true}
```

Via browser (easier):
1. Open http://localhost:3000
2. Login as any user (NOT admin)
3. Go to Feedback page
4. In the message box, type: `<script>alert('XSS Works!')</script>`
5. Click Submit
6. Should see "Feedback submitted!" alert

**2. View as admin:**
1. Logout
2. Login as admin/admin
3. Click "📝 View Feedbacks" button
4. **JavaScript alert should popup!**

**3. Check if feedback was saved:**
```bash
cd database
sqlite3 ecommerce.db
SELECT * FROM feedback;
.quit

# Should show the XSS payload in the message column
```

**4. Check browser console:**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for any errors
4. Look for "Content Security Policy" warnings

### If It's Not Working

**Check if dangerouslySetInnerHTML is present:**
```bash
cd frontend/src
grep -n "dangerouslySetInnerHTML" App.js

# Should show line number where it's used
```

**Verify feedback is loading:**
1. Login as admin
2. Open DevTools → Network tab
3. Go to View Feedbacks page
4. Look for request to /api/feedback
5. Check response - should contain your XSS payload

**Try simpler XSS payload:**
```html
<img src=x onerror="alert('XSS')">
```

**Check React version:**
```bash
cd frontend
cat package.json | grep react

# React should be 18.x
```

**Manual test in browser:**
1. Login as admin
2. Go to View Feedbacks
3. Open DevTools Console
4. Type: `eval('<script>alert("test")</script>')`
5. If this doesn't work, there may be a CSP blocking scripts

**Check for Content Security Policy:**
```bash
cd frontend/public
cat index.html | grep -i "content-security-policy"

# Should NOT have a CSP that blocks scripts
```

**Force refresh:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Try again

---

## 🔄 Complete Reset

If nothing works, try a complete reset:

```bash
# 1. Stop both servers (Ctrl+C in both terminals)

# 2. Delete database
cd backend
rm -rf ../database/ecommerce.db
rm -rf node_modules
rm -rf ../frontend/node_modules

# 3. Reinstall
npm install
cd ../frontend
npm install

# 4. Reinitialize database
cd ../backend
npm run init-db

# 5. Start servers
npm start &
cd ../frontend
npm start &

# 6. Test again
```

---

## 🐛 Common Issues

### "CORS error" in browser
- Server not running on port 3001
- Check backend terminal for errors
- Restart backend server

### "Network error"
- Frontend not connecting to backend
- Check if both servers are running
- Check firewall settings

### "401 Unauthorized"
- Auth token expired or invalid
- Delete cookies and login again
- Check if checkAuth middleware is working

### XSS not executing
- React may be escaping HTML
- Check if dangerouslySetInnerHTML is used
- Check browser console for CSP errors
- Try in different browser (Chrome vs Firefox)

### PUT/PATCH returns 404
- Endpoint not defined
- Check server.js for route definitions
- Make sure server restarted after changes

---

## 📞 Getting Help

If issues persist:

1. **Check backend console** - errors will show there
2. **Check browser console** - frontend errors show there
3. **Check Network tab** - see actual requests/responses
4. **Try Postman** - isolate if it's a curl issue
5. **Check package versions** - ensure Node.js 16+

**Verification Commands:**
```bash
node --version  # Should be 16.x or higher
npm --version   # Should be 8.x or higher
curl --version  # Should be 7.x or higher
```

**Port Check:**
```bash
# Check if ports are in use
netstat -an | grep 3000
netstat -an | grep 3001

# Kill processes if needed
# On Windows: taskkill /F /IM node.exe
# On Linux/Mac: killall node
```

---

## ✅ Success Criteria

You'll know everything works when:

1. **Admin re-registration**: Response shows `"role":"admin"`
2. **PUT/PATCH**: Response shows `{"success":true,"changes":1}`
3. **XSS**: Alert popup appears when admin views feedback

---

**Need to test step-by-step? Follow this exact sequence:**

```bash
# Terminal 1 - Backend
cd vulnerable-ecommerce/backend
npm start

# Terminal 2 - Frontend  
cd vulnerable-ecommerce/frontend
npm start

# Terminal 3 - Testing
cd vulnerable-ecommerce

# Test 1: Admin role preservation
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"newpass"}' | jq

# Should see: "role": "admin"

# Test 2: PUT request
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"username":"admin","password":"newpass"}' -c cookies.txt

curl -X PUT http://localhost:3001/api/users/2 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"credit":999999}' | jq

# Should see: {"success": true, "changes": 1}

# Test 3: XSS - Must test in browser!
# 1. Open http://localhost:3000
# 2. Login as regular user
# 3. Submit feedback: <script>alert('XSS')</script>
# 4. Logout, login as admin
# 5. View feedbacks → Alert appears
```
