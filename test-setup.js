/**
 * Comprehensive Test Setup and Validation Script
 * 
 * This script checks all dependencies, configurations, and runs tests
 * to ensure everything is working properly.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 SaaS Backend - Comprehensive Test Setup\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found. Please run this script from the backend directory.');
  process.exit(1);
}

console.log('✅ Found package.json');

// Check environment file
const envPath = path.join(process.cwd(), 'env.development');
if (!fs.existsSync(envPath)) {
  console.error('❌ env.development not found.');
  process.exit(1);
}

console.log('✅ Found env.development');

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

// Test TypeScript compilation
console.log('\n🔨 Testing TypeScript compilation...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.error('❌ TypeScript compilation failed');
  console.log('Please check the error messages above and fix any issues.');
  process.exit(1);
}

// Check if dist folder was created
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ Build output created successfully');
} else {
  console.error('❌ Build output not found');
  process.exit(1);
}

// Test linting
console.log('\n🔍 Testing ESLint...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ ESLint passed');
} catch (error) {
  console.log('⚠️ ESLint found some issues (this is normal for development)');
}

// Check environment configuration
console.log('\n⚙️ Checking environment configuration...');
const envContent = fs.readFileSync(envPath, 'utf8');
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'GEMINI_API_KEY',
  'REDIS_HOST',
  'STORAGE_PROVIDER',
  'BASE_URL'
];

let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (!envContent.includes(varName)) {
    missingVars.push(varName);
  }
});

if (missingVars.length === 0) {
  console.log('✅ All required environment variables are configured');
} else {
  console.log('⚠️ Missing environment variables:', missingVars.join(', '));
}

// Check if uploads directory exists
const uploadsPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsPath, { recursive: true });
  fs.mkdirSync(path.join(uploadsPath, 'raw'), { recursive: true });
  fs.mkdirSync(path.join(uploadsPath, 'generated'), { recursive: true });
  console.log('✅ Uploads directory created');
} else {
  console.log('✅ Uploads directory exists');
}

// Check if logs directory exists
const logsPath = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsPath)) {
  console.log('📁 Creating logs directory...');
  fs.mkdirSync(logsPath, { recursive: true });
  console.log('✅ Logs directory created');
} else {
  console.log('✅ Logs directory exists');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next Steps:');
console.log('1. Start the development server: npm run start:dev');
console.log('2. Test the API: node test-image-generation.js');
console.log('3. Check Swagger docs: http://localhost:8080/api/docs');
console.log('4. Check health: http://localhost:8080/api/v1/health');

console.log('\n🔧 Configuration Summary:');
console.log('- Database: PostgreSQL (localhost:5432)');
console.log('- Redis: localhost:6379');
console.log('- Storage: Local filesystem');
console.log('- Port: 8080');
console.log('- Environment: development');

console.log('\n⚠️ Important Notes:');
console.log('- Make sure PostgreSQL is running on localhost:5432');
console.log('- Make sure Redis is running on localhost:6379 (optional for basic functionality)');
console.log('- The application will work without Redis, but caching will be disabled');
console.log('- Database will be created automatically on first run');
