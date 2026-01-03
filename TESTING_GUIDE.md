# 🧪 Complete Testing Guide

## 📋 Prerequisites

Before running any tests, ensure you have:

1. **Node.js** (v18 or higher)
2. **PostgreSQL** running on localhost:5432

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
node start-dev.js
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Test build
npm run build

# 3. Start development server
npm run start:dev
```

## 🔧 Environment Configuration

Your `env.development` file is already configured with all necessary settings:

### ✅ Required Services
- **Database**: PostgreSQL (localhost:5432)
- **Storage**: Local filesystem
- **Port**: 3000

### ✅ API Keys (Mock for Development)
- **JWT Secrets**: Configured
- **Gemini API**: Mock key (ready for real API)
- **Storage**: Local provider

## 🧪 Testing Commands

### 1. Build Test
```bash
npm run build
```
**Expected**: Successful compilation with no errors

### 2. Lint Test
```bash
npm run lint
```
**Expected**: Code style validation (warnings are normal)

### 3. Development Server
```bash
npm run start:dev
```
**Expected**: Server starts on http://localhost:8080

### 4. API Testing
```bash
node test-image-generation.js
```
**Expected**: Complete API test with image generation

## 🌐 API Endpoints to Test

### Health Check
```bash
curl http://localhost:8080/api/v1/health
```

### Swagger Documentation
Open: http://localhost:8080/api/docs

### Image Generation API
```bash
# 1. Register user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"John","lastName":"Doe"}'

# 2. Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. Generate image (replace <token> with JWT from login)
curl -X POST http://localhost:8080/api/v1/images/generate \
  -H "Authorization: Bearer <token>" \
  -F "images=@test-image.jpg" \
  -F "gender=male" \
  -F "style=modern"
```

## 📊 Monitoring & Metrics

### Prometheus Metrics
```bash
curl http://localhost:8080/api/v1/metrics/prometheus
```

### Health Metrics
```bash
curl http://localhost:8080/api/v1/metrics/health
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Start PostgreSQL service
```bash
# Windows
net start postgresql

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

#### 2. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::8080
```
**Solution**: Kill process using port 8080
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8080 | xargs kill -9
```

#### 4. TypeScript Compilation Errors
```
ERROR in src/...
```
**Solution**: Check for missing imports or type issues
```bash
npm run build
```

## 📁 File Structure Check

Ensure these directories exist:
```
backend/
├── src/
├── uploads/
│   ├── raw/
│   └── generated/
├── logs/
├── dist/ (after build)
├── node_modules/ (after npm install)
├── env.development
└── package.json
```

## 🎯 Expected Test Results

### ✅ Successful Build
- No TypeScript errors
- All modules compile
- Dist folder created

### ✅ Successful Server Start
- Server listening on port 8080
- Database connection established
- All modules loaded

### ✅ Successful API Test
- User registration works
- User login works
- Image generation works
- File upload works
- Response format correct

## 🔍 Debugging Tips

### 1. Check Logs
```bash
tail -f logs/app.log
```

### 2. Enable Debug Mode
```bash
DEBUG=* npm run start:dev
```

### 3. Check Environment Variables
```bash
node -e "console.log(process.env.NODE_ENV)"
```

### 4. Test Database Connection
```bash
psql -h localhost -U postgres -d saas_dev
```

## 📞 Support

If you encounter issues:

1. Check the logs in `logs/app.log`
2. Verify all services are running
3. Check environment configuration
4. Run the automated test script: `node test-setup.js`

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ `npm run build` completes without errors
- ✅ `npm run start:dev` starts successfully
- ✅ Health check returns 200 OK
- ✅ Swagger docs load at /api/docs
- ✅ Image generation API works
- ✅ All endpoints respond correctly

**Your SaaS backend is now ready for development! 🚀**
