# 🚀 Quick Start Guide

## Get Started in 3 Steps

### Step 1: Install Dependencies & Setup

```bash
cd vulnerable-ecommerce
./setup.sh
```

Or manually:
```bash
# Backend
cd backend
npm install
npm run init-db

# Frontend
cd ../frontend
npm install
```

### Step 2: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 3: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Admin Login: `admin` / `admin`

---

## 📚 Documentation Overview

1. **README.md** - Main documentation with all vulnerability descriptions
2. **VULNERABILITIES.md** - Quick reference card for all vulnerabilities  
3. **TESTING_GUIDE.md** - Step-by-step exploitation tutorials
4. **SOLUTIONS.md** - How to fix each vulnerability
5. **QUICK_START.md** - This file

---

## 🎯 Recommended Learning Path

### Beginners (Day 1-2)
- Read README.md introduction
- Start with SQL Injection and IDOR
- Follow TESTING_GUIDE.md examples
- Try 5-10 basic vulnerabilities

### Intermediate (Day 3-4)
- Explore XSS and Command Injection
- Try XXE and SSRF attacks
- Practice with file upload bypasses
- Chain multiple vulnerabilities

### Advanced (Day 5+)
- Study business logic flaws
- Create automated exploit scripts
- Read SOLUTIONS.md to understand fixes
- Try creating your own vulnerable app

---

## ⚠️ CRITICAL WARNINGS

**🔴 THIS IS A DELIBERATELY VULNERABLE APPLICATION 🔴**

- **DO NOT** deploy on public networks
- **DO NOT** use in production
- **DO NOT** store real user data
- **ONLY** use in isolated environments for training

---

## 🛠️ Troubleshooting

**Port conflicts?**
- Change PORT in backend/server.js
- Change PORT in frontend/.env

**Database errors?**
```bash
cd backend
rm -rf ../database/*.db
npm run init-db
```

**Module not found?**
```bash
cd backend && npm install
cd frontend && npm install
```

---

## 📞 Need Help?

- Check README.md for detailed documentation
- Review TESTING_GUIDE.md for specific vulnerability tests
- See SOLUTIONS.md for security best practices

---

Happy Learning! 🎓
