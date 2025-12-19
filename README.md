# AI-app Backend

A production-ready backend for the AI-app, built with NestJS, TypeScript, PostgreSQL, and modern development practices.

## 🚀 Features

### Core Setup
- **NestJS** with TypeScript
- **ESLint** + **Prettier** + **Husky** pre-commit hooks
- Environment-based configuration with validation
- **GitHub Actions** CI/CD pipeline

### API & Developer Experience
- REST API with versioning (`/api/v1`)
- **Swagger** documentation auto-generated
- Request validation with `class-validator`
- Global exception filters & error handling
- Structured logging with request correlation
- CORS configuration with whitelist
- Public vs Private routes separation

### Security
- **JWT Authentication** (access + refresh tokens)
- Role-based authorization (admin, user)
- Password hashing with bcrypt
- **Helmet** for secure headers
- Rate limiting
- CSRF protection (configurable)

### Database
- **PostgreSQL** with **TypeORM**
- Migration support
- BaseEntity with UUID, timestamps, soft delete
- User and Image entities

### Modules
- **AuthModule**: Register, Login, Refresh, Logout
- **UserModule**: CRUD operations with role-based access
- **AdminModule**: Manages administrative tasks.
- **WebAppModule**: Provides backend functionality for the web application.
- **HealthModule**: Health and readiness checks
- **CommonModule**: Shared utilities, guards, interceptors

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd saas-backend-boilerplate

# 2. Install dependencies
npm install

# 3. Setup environment (already configured)
# env.development is ready to use

# 4. Start the application
npm run start:dev
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd saas-backend-boilerplate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment is pre-configured**
   ```bash
   # env.development is already configured with:
   # - Database: PostgreSQL (localhost:5432)
   # - Redis: localhost:6379 (optional)
   # - Storage: Local filesystem
   # - All API keys: Mock values ready
   ```

4. **Setup database** (if needed)
   ```bash
   # Create PostgreSQL database
   createdb saas_dev
   
   # Run migrations (automatic on first start)
   npm run migration:run
   ```

5. **Start the application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

## 🎯 What You Get

After starting the application, you'll have:

- ✅ **API Server**: http://localhost:8080
- ✅ **Swagger Docs**: http://localhost:8080/api/docs
- ✅ **Health Check**: http://localhost:8080/api/v1/health
- ✅ **Authentication**: JWT-based with refresh tokens
- ✅ **Security**: Rate limiting, validation, CORS

## 🔧 Configuration

### Environment Variables

The application uses environment-specific configuration files:

- `env.development` - Development environment
- `env.production` - Production environment  
- `env.test` - Test environment

Key configuration options:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=saas_dev

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 📚 API Documentation

Once the application is running, you can access:

- **🌐 Swagger UI**: http://localhost:8080/api/docs
- **❤️ Health Check**: http://localhost:8080/api/v1/health
- **📊 Metrics**: http://localhost:8080/api/v1/metrics/prometheus
- **🔍 Health Metrics**: http://localhost:8080/api/v1/metrics/health

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | Register new user | ❌ |
| `POST` | `/api/v1/auth/login` | Login user | ❌ |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | ❌ |
| `POST` | `/api/v1/auth/logout` | Logout user | ✅ |
| `GET` | `/api/v1/auth/profile` | Get user profile | ✅ |

### 👥 User Management Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/api/v1/users` | Get all users | ✅ | Admin |
| `GET` | `/api/v1/users/:id` | Get user by ID | ✅ | User/Admin |
| `PATCH` | `/api/v1/users/:id` | Update user | ✅ | User/Admin |
| `PATCH` | `/api/v1/users/:id/change-password` | Change password | ✅ | User/Admin |
| `DELETE` | `/api/v1/users/:id` | Delete user | ✅ | Admin |



### 📊 Monitoring & Health Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/health` | Application health check | ❌ |
| `GET` | `/api/v1/metrics/prometheus` | Prometheus metrics | ❌ |
| `GET` | `/api/v1/metrics/health` | Detailed health metrics | ✅ |
| `GET` | `/api/v1/metrics/json` | Metrics in JSON format | ✅ |



### 🔧 Quick API Testing

#### 1. Register User
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```



#### 4. Check Health
```bash
curl http://localhost:8080/api/v1/health
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🔍 Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run build
```

## 🚀 Deployment

### Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Environment Setup

1. **Production Database**: Set up PostgreSQL with proper credentials
2. **Environment Variables**: Configure production environment variables
3. **SSL Certificates**: Set up SSL for HTTPS
4. **Reverse Proxy**: Configure Nginx or similar
5. **Process Manager**: Use PM2 or similar for process management

### CI/CD

The GitHub Actions workflow includes:
- Linting and formatting checks
- Unit and integration tests
- Security audits
- Build verification
- Deployment (configure as needed)

## 📁 Project Structure

```
src/
├── config/                 # Configuration files
├── database/              # Database entities and configuration
├── common/                # Shared utilities, guards, decorators
├── modules/               # Feature modules
│   ├── auth/             # Authentication module
│   ├── users/            # User management module
│   ├── admin/            # Admin module
│   ├── webapp/           # WebApp module
│   └── health/           # Health checks
├── app.module.ts         # Root module
└── main.ts              # Application entry point
```

## 🔐 Security Features

- **JWT Authentication** with access and refresh tokens
- **Role-based Authorization** (Admin, User)
- **Password Hashing** with bcrypt
- **Rate Limiting** to prevent abuse
- **CORS** configuration
- **Helmet** for security headers
- **Input Validation** with class-validator
- **SQL Injection Protection** with TypeORM

## 🎯 Best Practices

- **Environment-based Configuration**: Separate configs for dev/prod/test
- **Validation**: Request validation with DTOs
- **Error Handling**: Global exception filters
- **Logging**: Structured logging with correlation IDs
- **Testing**: Unit and integration tests
- **Code Quality**: ESLint, Prettier, Husky hooks
- **Documentation**: Auto-generated Swagger docs
- **Security**: Multiple layers of security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation at `/api/docs`

## 🔄 Updates

This boilerplate is regularly updated with:
- Latest NestJS features
- Security updates
- Best practices improvements
- New integrations and modules

---

**Happy Coding! 🚀**
