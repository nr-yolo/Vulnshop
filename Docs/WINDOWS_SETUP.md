# 🪟 Windows Setup Guide for VulnShop

## Prerequisites

1. **Node.js** - Download from https://nodejs.org/ (LTS version recommended)
   - During installation, make sure "Add to PATH" is checked
   - Verify installation: Open Command Prompt and run `node --version`

2. **Git** (optional) - Download from https://git-scm.com/

## 📥 Installation Steps

### Step 1: Extract the ZIP file

1. Right-click on `vulnerable-ecommerce.zip`
2. Select "Extract All..."
3. Choose a location (e.g., `C:\Projects\`)
4. Click "Extract"

### Step 2: Run Setup

**Option A - Automated (Recommended):**

1. Navigate to the extracted folder
2. Double-click `setup.bat`
3. Type `yes` and press Enter when prompted
4. Wait for installation to complete

**Option B - Manual:**

1. Open Command Prompt (press `Win + R`, type `cmd`, press Enter)
2. Navigate to the project:
   ```cmd
   cd C:\path\to\vulnerable-ecommerce
   ```

3. Install backend:
   ```cmd
   cd backend
   npm install
   npm run init-db
   cd ..
   ```

4. Install frontend:
   ```cmd
   cd frontend
   npm install
   cd ..
   ```

## 🚀 Running the Application

### Easy Method (Using Batch Files):

1. Double-click `start-backend.bat` - Opens backend server
2. Double-click `start-frontend.bat` - Opens frontend in browser

**Keep both windows open while using the app!**

### Manual Method:

**Command Prompt Window 1 (Backend):**
```cmd
cd C:\path\to\vulnerable-ecommerce\backend
npm start
```

**Command Prompt Window 2 (Frontend):**
```cmd
cd C:\path\to\vulnerable-ecommerce\frontend
npm start
```

## 🌐 Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Default Login: `admin` / `admin`

Your browser should open automatically when frontend starts!

## 🛠️ Troubleshooting

### "npm is not recognized"
- Node.js not installed or not in PATH
- Install Node.js from https://nodejs.org/
- Restart Command Prompt after installation

### Port Already in Use

**Backend (Port 3001 in use):**
1. Open `backend\server.js`
2. Change `const PORT = 3001;` to `const PORT = 3002;`
3. Save and restart

**Frontend (Port 3000 in use):**
1. Create file `frontend\.env`
2. Add line: `PORT=3002`
3. Save and restart

### Database Errors

```cmd
cd backend
del ..\database\ecommerce.db
npm run init-db
```

### Module Not Found Errors

```cmd
cd backend
rmdir /s /q node_modules
npm install

cd ..\frontend
rmdir /s /q node_modules
npm install
```

### Windows Firewall Popup
- Click "Allow access" when prompted
- This allows Node.js to run local servers

## 📝 Testing with curl on Windows

### Option 1: Use PowerShell (Built-in)

```powershell
# SQL Injection test
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin'' OR ''1''=''1'' --","password":"test"}'

# IDOR test
Invoke-RestMethod -Uri "http://localhost:3001/api/users/1"
```

### Option 2: Install curl for Windows

Download from: https://curl.se/windows/

### Option 3: Use Postman

Download from: https://www.postman.com/downloads/

## 🔍 Testing Tools for Windows

**Recommended:**
- **Burp Suite Community Edition** - https://portswigger.net/burp/communitydownload
- **Postman** - https://www.postman.com/downloads/
- **Firefox Developer Tools** - Built into Firefox
- **Chrome DevTools** - Built into Chrome

## 📂 Project Structure

```
vulnerable-ecommerce/
├── setup.bat              ← Run this first (Windows setup)
├── start-backend.bat      ← Start backend server
├── start-frontend.bat     ← Start frontend app
├── README.md              ← Main documentation
├── WINDOWS_SETUP.md       ← This file
├── TESTING_GUIDE.md       ← Exploitation tutorials
├── VULNERABILITIES.md     ← Quick reference
├── SOLUTIONS.md           ← How to fix vulnerabilities
├── backend/               ← Node.js API server
│   ├── server.js
│   ├── init-db.js
│   └── package.json
└── frontend/              ← React application
    ├── src/
    └── package.json
```

## ⚠️ Security Warning

**🔴 THIS IS A DELIBERATELY VULNERABLE APPLICATION 🔴**

- **NEVER** deploy on public internet
- **ONLY** use on local machine (localhost)
- **FOR TRAINING** purposes only
- Windows Firewall will protect you on local network

## 🎯 Quick Start Commands

```cmd
REM Setup (one time)
setup.bat

REM Start backend (keep this running)
start-backend.bat

REM Start frontend (keep this running)
start-frontend.bat

REM Stop servers: Press Ctrl+C in each window
```

## 📚 Next Steps

1. Open http://localhost:3000
2. Login with `admin` / `admin`
3. Read `TESTING_GUIDE.md` for exploitation examples
4. Try SQL injection: username = `admin' OR '1'='1' --`
5. Explore all 40+ vulnerabilities!

## 💡 Tips for Windows Users

- **Use PowerShell ISE** for better scripting
- **Install Windows Terminal** for better command line experience
- **Use VS Code** to edit code files
- **Run as Administrator** if you encounter permission issues
- **Disable antivirus temporarily** if it blocks file operations (re-enable after!)

## 🆘 Need Help?

1. Check `README.md` for detailed documentation
2. Review `TESTING_GUIDE.md` for examples
3. Make sure Node.js is properly installed
4. Ensure ports 3000 and 3001 are free

---

Happy Learning! 🎓
