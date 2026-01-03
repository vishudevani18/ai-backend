# AI-app Backend Getting Started Guide

This guide will help you set up and run the AI-app Backend locally.

## 🚀 Quick Start

### 1. Prerequisites

Make sure you have the following installed:
- **Node.js 18+** ([Download](https://nodejs.org/))
- **PostgreSQL 15+** ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

### 2. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd saas-backend-boilerplate

# Install dependencies
npm install
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb saas_dev

# Or using psql
psql -U postgres
CREATE DATABASE saas_dev;
\q
```

### 4. Environment Configuration

```bash
# Copy development environment file
cp env.development .env

# Edit the .env file with your database credentials
nano .env
```

Update the following in your `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_DATABASE=saas_dev
```

### 5. Run Database Migrations

```bash
# Database schema is automatically synchronized from entities
# No migrations needed for fresh database setup
```

### 6. Start the Application

```bash
# Development mode
npm run start:dev

# Or production mode
npm run build
npm run start:prod
```

The application will be available at:
- **API**: http://localhost:8080
- **Swagger Docs**: http://localhost:8080/api/docs
- **Health Check**: http://localhost:8080/api/v1/health

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## 🔧 Development Commands

```bash
# Code formatting
npm run format

# Linting
npm run lint

# Type checking
npm run build

# Database operations
# Schema is automatically synchronized from entities (synchronize: true)
# Migrations can be added later when needed
```

## 📝 API Testing

### 1. Register a User

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

### 2. Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```






## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5432
   ```
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Migration Errors**
   ```
   Error: relation "users" already exists
   ```
   - Drop and recreate database
   - Or check existing migrations

3. **JWT Errors**
   ```
   Error: jwt malformed
   ```
   - Ensure JWT_SECRET is set
   - Check token format in requests

4. **Port Already in Use**
   ```
   Error: listen EADDRINUSE :::8080
   ```
   - Change PORT in `.env`
   - Or kill process using port 8080

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run start:dev

# Check database connection
npm run typeorm -- query "SELECT 1"
```

## 📚 Next Steps

1. **Customize Configuration**: Update environment variables for your needs
2. **Add Features**: Extend modules with your business logic
3. **Database Design**: Modify entities and create new migrations
4. **API Documentation**: Update Swagger decorators
5. **Testing**: Add more comprehensive tests
6. **Deployment**: Set up production environment

## 🆘 Getting Help

- Check the [README.md](./README.md) for detailed documentation
- Review API documentation at [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Create an issue for bugs or feature requests
- Check existing issues and discussions

---

**Happy Coding! 🚀**
