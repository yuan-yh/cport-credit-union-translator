# DEPLOYMENT.md

**Project**: cPort Credit Union Translation Tool  
**Purpose**: Deployment configuration and environment setup  
**Last Updated**: August 24, 2025  
**Phase**: MVP Development  

## Overview

This document covers development environment setup, production deployment, and operational procedures for cPort's translation tool. Designed for simple deployment with minimal DevOps experience.

---

## **DEVELOPMENT ENVIRONMENT SETUP**

### **Prerequisites**
```bash
Required Software:
- Node.js: v20.15.1 (LTS)
- npm: v10.x (comes with Node.js)
- PostgreSQL: v15.7
- Git: v2.45+
- Visual Studio Code (recommended)

Operating Systems Supported:
- macOS 13+
- Windows 11 Pro
- Ubuntu 22.04 LTS
```

### **Local Development Setup**

#### **1. Repository Setup**
```bash
# Clone repository
git clone https://github.com/cport-cu/translation-tool.git
cd translation-tool

# Install dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Install backend dependencies  
cd server
npm install
cd ..
```

#### **2. Database Setup**
```bash
# Install PostgreSQL locally
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql postgresql-contrib
# Windows: Download from postgresql.org

# Create database
createdb cport_translation_dev

# Set up environment variables (see Environment Configuration section)
cp .env.example .env
# Edit .env with your database credentials
```

#### **3. Database Initialization**
```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

#### **4. Start Development Servers**
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend  
cd client
npm run dev

# Backend runs on: http://localhost:3001
# Frontend runs on: http://localhost:5173
```

---

## **ENVIRONMENT CONFIGURATION**

### **Environment Variables**

#### **Development Environment (.env.local)**
```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/cport_translation_dev"

# Google Cloud Translation API
GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
GOOGLE_CLOUD_PROJECT_ID="cport-translation-dev"

# OpenAI API (for Whisper)
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Hume AI API
HUME_API_KEY="your-hume-api-key-here"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-for-development"
JWT_EXPIRES_IN="4h"

# Session Configuration
SESSION_SECRET="your-session-secret-for-development"

# Email Configuration (Development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-development-email@gmail.com"
SMTP_PASSWORD="your-app-specific-password"

# Application Configuration
NODE_ENV="development"
PORT="3001"
CLIENT_URL="http://localhost:5173"

# File Upload Configuration
UPLOAD_MAX_SIZE="10MB"
UPLOAD_ALLOWED_TYPES="pdf,jpg,jpeg,png"
```

#### **Production Environment (.env.production)**
```bash
# Database Configuration (Production)
DATABASE_URL="postgresql://cport_user:secure_password@localhost:5432/cport_translation_prod"

# Google Cloud Translation API (Production)
GOOGLE_APPLICATION_CREDENTIALS="/opt/cport-translation/credentials/production-service-account.json"
GOOGLE_CLOUD_PROJECT_ID="cport-translation-prod"

# OpenAI API (Production)
OPENAI_API_KEY="sk-production-openai-api-key"

# Hume AI API (Production)  
HUME_API_KEY="production-hume-api-key"

# JWT Configuration (Production)
JWT_SECRET="super-secure-jwt-secret-minimum-32-characters"
JWT_EXPIRES_IN="4h"

# Session Configuration (Production)
SESSION_SECRET="super-secure-session-secret-minimum-32-characters"

# Email Configuration (Production)
SMTP_HOST="smtp.cportcu.org"
SMTP_PORT="587"
SMTP_USER="translation-system@cportcu.org"
SMTP_PASSWORD="secure-email-password"

# Application Configuration (Production)
NODE_ENV="production"
PORT="3001"
CLIENT_URL="https://translation.cportcu.org"

# Security Configuration
CORS_ORIGIN="https://translation.cportcu.org"
RATE_LIMIT_REQUESTS="1000"
RATE_LIMIT_WINDOW="15"

# File Upload Configuration (Production)
UPLOAD_MAX_SIZE="10MB"
UPLOAD_ALLOWED_TYPES="pdf,jpg,jpeg,png"
UPLOAD_PATH="/opt/cport-translation/uploads"
```

### **Google Cloud Service Account Setup**
```bash
# 1. Create service account in Google Cloud Console
# 2. Grant necessary permissions:
#    - Cloud Translation API User
#    - AutoML Editor (for custom models)
#    - Storage Object Admin (for training data)

# 3. Download service account key JSON file

# 4. For development:
#    Place in project root as 'google-service-account.json'

# 5. For production:
#    Place in '/opt/cport-translation/credentials/' directory
#    Set proper file permissions: chmod 600
```

---

## **PRODUCTION DEPLOYMENT**

### **VPS Server Specifications**
```yaml
Recommended VPS Configuration:
  Provider: DigitalOcean, Linode, or Vultr
  CPU: 4 vCPUs
  RAM: 16GB
  Storage: 100GB SSD
  Network: 1Gbps connection
  OS: Ubuntu 22.04 LTS
  Estimated Cost: $80-120/month
```

### **Server Initial Setup**

#### **1. Server Provisioning**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install NGINX
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install certbot for SSL certificates
sudo apt install -y certbot python3-certbot-nginx
```

#### **2. Database Setup (Production)**
```bash
# Switch to postgres user
sudo -u postgres psql

# Create production database and user
CREATE DATABASE cport_translation_prod;
CREATE USER cport_user WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE cport_translation_prod TO cport_user;
\q

# Configure PostgreSQL for production
sudo nano /etc/postgresql/15/main/postgresql.conf
# Uncomment and modify:
# listen_addresses = 'localhost'
# max_connections = 100

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### **3. Application Deployment**
```bash
# Create application directory
sudo mkdir -p /opt/cport-translation
sudo chown $USER:$USER /opt/cport-translation

# Clone repository
cd /opt/cport-translation
git clone https://github.com/cport-cu/translation-tool.git .

# Install dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Build frontend for production
cd client
npm run build
cd ..

# Set up environment variables
cp .env.example .env.production
nano .env.production
# Fill in production values

# Run database migrations
cd server
npx prisma migrate deploy
npx prisma generate
cd ..
```

### **PM2 Process Management**

#### **PM2 Configuration (ecosystem.config.js)**
```javascript
module.exports = {
  apps: [
    {
      name: 'cport-translation-api',
      script: './server/dist/index.js',
      cwd: '/opt/cport-translation',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_file: '.env.production',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
```

#### **PM2 Commands**
```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Monitor applications
pm2 status
pm2 logs
pm2 monit

# Restart applications
pm2 restart all
pm2 reload all  # Zero-downtime restart

# Stop applications
pm2 stop all
```

### **NGINX Configuration**

#### **NGINX Site Configuration (/etc/nginx/sites-available/cport-translation)**
```nginx
server {
    listen 80;
    server_name translation.cportcu.org;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name translation.cportcu.org;
    
    # SSL Configuration (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/translation.cportcu.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/translation.cportcu.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'" always;
    
    # Serve React frontend
    location / {
        root /opt/cport-translation/client/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Proxy API requests to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support for Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File upload size limit
    client_max_body_size 10M;
}
```

#### **Enable NGINX Site**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/cport-translation /etc/nginx/sites-enabled/

# Test NGINX configuration
sudo nginx -t

# Restart NGINX
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d translation.cportcu.org
```

---

## **BACKUP AND MONITORING**

### **Database Backup Configuration**

#### **Automated Backup Script (/opt/cport-translation/scripts/backup.sh)**
```bash
#!/bin/bash
BACKUP_DIR="/opt/cport-translation/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="cport_translation_prod"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -U cport_user -h localhost $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
```

#### **Cron Job for Automated Backups**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/cport-translation/scripts/backup.sh >> /opt/cport-translation/logs/backup.log 2>&1
```

### **Basic Monitoring Setup**

#### **System Health Check Script (/opt/cport-translation/scripts/health-check.sh)**
```bash
#!/bin/bash
LOG_FILE="/opt/cport-translation/logs/health-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check if application is running
if pm2 describe cport-translation-api > /dev/null; then
    echo "[$DATE] Application: RUNNING" >> $LOG_FILE
else
    echo "[$DATE] Application: DOWN - Attempting restart" >> $LOG_FILE
    pm2 restart cport-translation-api
fi

# Check database connection
if pg_isready -U cport_user -h localhost > /dev/null; then
    echo "[$DATE] Database: RUNNING" >> $LOG_FILE
else
    echo "[$DATE] Database: DOWN" >> $LOG_FILE
fi

# Check NGINX status
if systemctl is-active --quiet nginx; then
    echo "[$DATE] NGINX: RUNNING" >> $LOG_FILE
else
    echo "[$DATE] NGINX: DOWN" >> $LOG_FILE
    sudo systemctl restart nginx
fi

# Check disk space (alert if > 80% full)
DISK_USAGE=$(df / | grep -vE '^Filesystem' | awk '{ print $5 }' | sed 's/%//g')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage at $DISK_USAGE%" >> $LOG_FILE
fi
```

#### **Cron Job for Health Checks**
```bash
# Check system health every 5 minutes
*/5 * * * * /opt/cport-translation/scripts/health-check.sh
```

---

## **DEPLOYMENT PROCEDURES**

### **Initial Deployment Checklist**
```bash
# 1. Pre-deployment verification
□ Environment variables configured
□ Database migrations tested
□ Google Cloud credentials in place
□ SSL certificate obtained
□ NGINX configuration tested
□ PM2 configuration verified

# 2. Deployment steps
□ Stop existing application (if any)
□ Pull latest code from repository
□ Install/update dependencies
□ Run database migrations
□ Build frontend assets
□ Start application with PM2
□ Verify application health
□ Test critical functionality

# 3. Post-deployment verification
□ Application accessible via HTTPS
□ Translation API working
□ Database connections successful
□ WebSocket connections functional
□ Email notifications working
□ Backup procedures tested
```

### **Update Deployment Script (/opt/cport-translation/scripts/deploy.sh)**
```bash
#!/bin/bash
set -e

echo "Starting deployment..."

# Stop application
pm2 stop cport-translation-api

# Pull latest code
git pull origin main

# Install dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Run database migrations
cd server
npx prisma migrate deploy
npx prisma generate
cd ..

# Build frontend
cd client
npm run build
cd ..

# Restart application
pm2 start cport-translation-api

# Wait for application to start
sleep 10

# Health check
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "Deployment successful!"
    pm2 save
else
    echo "Deployment failed - rolling back"
    pm2 restart cport-translation-api
    exit 1
fi
```

### **Rollback Procedures**
```bash
# 1. Identify last working commit
git log --oneline -10

# 2. Rollback to specific commit
git checkout <commit-hash>

# 3. Run deployment script
./scripts/deploy.sh

# 4. If database rollback needed:
# Restore from backup (manual process)
# Run reverse migrations if available
```