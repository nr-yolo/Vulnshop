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
