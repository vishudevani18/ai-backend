/**
 * Development Startup Script
 * 
 * This script handles the complete development setup and startup process
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting SaaS Backend Development Environment\n');

// Function to run command and return promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function startDevelopment() {
  try {
    // Step 1: Check if dependencies are installed
    console.log('📦 Checking dependencies...');
    if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
      console.log('Installing dependencies...');
      await runCommand('npm', ['install']);
      console.log('✅ Dependencies installed\n');
    } else {
      console.log('✅ Dependencies already installed\n');
    }

    // Step 2: Create necessary directories
    console.log('📁 Creating directories...');
    const dirs = ['uploads', 'uploads/raw', 'uploads/generated', 'logs'];
    dirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created ${dir}/`);
      }
    });
    console.log('');

    // Step 3: Test build
    console.log('🔨 Testing build...');
    try {
      await runCommand('npm', ['run', 'build']);
      console.log('✅ Build successful\n');
    } catch (error) {
      console.log('❌ Build failed, but continuing with development mode...\n');
    }

    // Step 4: Start development server
    console.log('🚀 Starting development server...');
    console.log('📋 Server will be available at:');
    console.log('   - API: http://localhost:8080');
    console.log('   - Swagger: http://localhost:8080/api/docs');
    console.log('   - Health: http://localhost:8080/api/v1/health');
    console.log('   - Metrics: http://localhost:8080/api/v1/metrics/prometheus');
    console.log('\n📝 Press Ctrl+C to stop the server\n');

    // Start the development server
    const devProcess = spawn('npm', ['run', 'start:dev'], {
      stdio: 'inherit',
      shell: true
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping development server...');
      devProcess.kill('SIGINT');
      process.exit(0);
    });

    devProcess.on('close', (code) => {
      console.log(`\n📊 Development server stopped with code ${code}`);
    });

  } catch (error) {
    console.error('❌ Error starting development environment:', error.message);
    process.exit(1);
  }
}

// Run the startup process
startDevelopment();
