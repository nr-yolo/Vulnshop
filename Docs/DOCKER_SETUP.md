# 🐳 Docker Setup Guide - VulnShop

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed
- Docker Compose installed (included with Docker Desktop)

### Start the Application

```bash
# Clone/extract the project
cd vulnerable-ecommerce

# Start both frontend and backend
docker-compose up

# Or run in detached mode (background)
docker-compose up -d
```

### Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3000 (click "API Docs" button)

### Stop the Application
```bash
# Stop containers
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

---

## Detailed Instructions

### Build Images
```bash
# Build both images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### View Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs (live updates)
docker-compose logs -f
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Access Container Shell
```bash
# Backend container
docker-compose exec backend sh

# Frontend container
docker-compose exec frontend sh
```

### Reset Database
```bash
# Stop containers
docker-compose down

# Remove volumes
docker-compose down -v

# Restart (will reinitialize database)
docker-compose up
```

---

## Running on Different Host/Port

### Change Ports
Edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:3001"  # Change 8001 to your desired port
  
  frontend:
    ports:
      - "8000:3000"  # Change 8000 to your desired port
```

### Access from Other Machines

The application binds to 0.0.0.0 by default when using Docker, making it accessible from other machines on your network.

```bash
# Start with docker-compose
docker-compose up

# Access from another machine
http://YOUR_IP_ADDRESS:3000
```

**⚠️ WARNING:** Only do this on isolated/trusted networks! This application is intentionally vulnerable.

---

## Environment Variables

### Backend Environment Variables
- `HOST`: Host to bind (default: 0.0.0.0)
- `PORT`: Port to listen on (default: 3001)

### Frontend Environment Variables
- `HOST`: Host to bind (default: 0.0.0.0)
- `REACT_APP_API_URL`: Backend API URL

Example custom configuration:
```yaml
services:
  backend:
    environment:
      - HOST=0.0.0.0
      - PORT=3001
      - CUSTOM_VAR=value
```

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
# On Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# On Linux/Mac:
lsof -i :3000
lsof -i :3001

# Kill the process or change ports in docker-compose.yml
```

### Container Won't Start
```bash
# View detailed logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild images
docker-compose build --no-cache
docker-compose up
```

### Database Issues
```bash
# Reset everything
docker-compose down -v
docker-compose up

# If that doesn't work, remove all Docker data
docker system prune -a
docker volume prune
docker-compose up --build
```

### Permission Errors (Linux)
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Or run with sudo
sudo docker-compose up
```

### Hot Reload Not Working
The docker-compose.yml is configured with:
- Volume mounting for live code updates
- WATCHPACK_POLLING for React hot reload

If still not working:
```bash
# Restart frontend container
docker-compose restart frontend
```

---

## Production Deployment (NOT RECOMMENDED)

**⚠️ THIS APPLICATION IS INTENTIONALLY VULNERABLE**

**DO NOT deploy this in production or on public networks!**

This application is for security training only and contains deliberate vulnerabilities:
- SQL Injection
- XSS
- IDOR
- Path Traversal
- XXE
- Command Injection
- And 40+ more vulnerabilities

---

## Docker Commands Reference

### Basic Commands
```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

### Advanced Commands
```bash
# Rebuild and start
docker-compose up --build

# Remove all stopped containers
docker-compose rm

# Scale services
docker-compose up --scale backend=2

# Execute command in container
docker-compose exec backend npm run init-db

# View resource usage
docker stats
```

### Cleanup Commands
```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes
docker-compose down -v

# Remove unused images
docker image prune

# Remove everything (careful!)
docker system prune -a
```

---

## Network Configuration

### Default Network
Docker Compose creates a bridge network automatically:
- Network name: `vulnerable-ecommerce_vulnshop-network`
- Frontend can access backend at: `http://backend:3001`
- Backend can access frontend at: `http://frontend:3000`

### Custom Network
Edit `docker-compose.yml`:
```yaml
networks:
  custom-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
```

---

## Volume Management

### Persistent Data
The docker-compose.yml mounts:
- Source code (for hot reload)
- Database directory (for data persistence)

### View Volumes
```bash
docker volume ls

# Inspect volume
docker volume inspect vulnerable-ecommerce_database
```

### Backup Database
```bash
# Copy database from container
docker cp vulnshop-backend:/app/../database/ecommerce.db ./backup.db

# Restore database
docker cp ./backup.db vulnshop-backend:/app/../database/ecommerce.db
```

---

## Security Notes for Docker

Even though this is a vulnerable application for training:

### Isolation
- Containers are isolated from host system
- Database is in a separate volume
- Network is isolated

### Monitoring
```bash
# View container logs
docker-compose logs -f

# Monitor resource usage
docker stats vulnshop-backend vulnshop-frontend
```

### Cleanup
Always clean up after testing:
```bash
docker-compose down -v
docker system prune -a
```

---

## FAQ

**Q: Can I run this on a different machine?**
A: Yes, just make sure Docker is installed and ports 3000/3001 are available.

**Q: How do I reset everything?**
A: `docker-compose down -v && docker-compose up --build`

**Q: Can I access from my phone?**
A: Yes, if on same network: `http://YOUR_COMPUTER_IP:3000`

**Q: Why is it slow?**
A: First build takes time. Subsequent starts are fast.

**Q: How do I update the code?**
A: Just edit files - hot reload is enabled. Or rebuild: `docker-compose up --build`

---

## Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Verify containers running: `docker-compose ps`
3. Rebuild: `docker-compose up --build`
4. Reset: `docker-compose down -v && docker-compose up`

For more help, check:
- README.md
- DEBUGGING_GUIDE.md
- Docker documentation: https://docs.docker.com

---

**Happy (Ethical) Hacking! 🎯**
