# 🚨 VulnShop - Deliberately Vulnerable E-Commerce Platform
Vulnshop is a deliberately vulnerable e-commerce web application designed for security researchers, students, and penetration testing practice. The application was generated with the assistance of Claude AI and built to simulate a modern online shopping platform with intentionally embedded security flaws for educational and training purposes.

The platform runs on Node.js 24 and has been tested on both Windows and Linux environments to ensure cross-platform compatibility. It includes typical e-commerce features such as user registration and login, product browsing, shopping cart functionality, order management, and an administrative dashboard.

Vulnshop contains 40+ intentionally introduced vulnerabilities spanning multiple categories of web application security. These include issues related to authentication, authorization, input validation, session management, deserialization, business logic, and API security. The application is designed with multiple attack paths, allowing learners to chain vulnerabilities together to simulate real-world exploitation scenarios.

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
- Log viewer 
- SMTP configuration
- Server statistics

---

## 🔧 Prerequisites

- Node.js (v24)
- npm or yarn
- SQLite3

---

## 📦 Installation using docker

### 1. Clone or Download the Project

```bash
git clone https://github.com/nr-yolo/Vulnshop.git
cd Vulnshop
```

### 2. Install using docker (preferred)

```bash
docker compose up -d
```

### 3. Visit webui

http://localhost:3000/

## 📦 Installation on windows.

### 1. Clone or Download the Project

```bash
git clone https://github.com/nr-yolo/Vulnshop.git
cd Vulnshop
```

### 2. Install node 24 

follow node installation documentation.

### 3. Run bat files

double click setup.bat
double click start-backend.bat
double click start-frontend.bat

### 4. Visit webui

http://localhost:3000/

## 📦 Installation on linux.

### 1. Clone or Download the Project

```bash
git clone https://github.com/nr-yolo/Vulnshop.git
cd Vulnshop
```

### 2. Install node 24 

follow node installation documentation.

### 3. Run sh files

double click setup.sh

### 4. start server

cd backend
npm start

cd frontend
npm start

### 5. Visit webui

http://localhost:3000/

## 🔐 Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin`

**New Users:**
- Register to create a new account
- Each new user receives $100 credit automatically

---


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
- if you are using the dockerized version you only need to change port number 

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

This is lab is currently created using various LLM models. Rewriting this code without ai slop, adding a few more vulnerabilities and dockerizing is on my Todo list someday.
Posting walkthroughs videos and pdfs are highly encouraged.

---

## 📝 License

This project is released under MIT License for educational purposes only.

---

## 🙏 Acknowledgments

Inspired by:
- bugbounty reports
- Juice Shop (OWASP)

---

**Remember: This application is a learning tool. Always practice ethical hacking and responsible disclosure!**
