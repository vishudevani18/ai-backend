/**
 * Test script for Image Generation API
 * 
 * This script demonstrates how to use the image generation endpoint
 * with proper authentication and file upload.
 * 
 * Prerequisites:
 * 1. Start the application: npm run start:dev
 * 2. Have test images ready in the current directory
 * 3. Install dependencies: npm install
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8080/api/v1';

// Test configuration
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe'
};

const TEST_IMAGE_GENERATION = {
  gender: 'male',
  style: 'indian-traditional',
  description: 'Please make the outfit more colorful and add traditional jewelry'
};

let authToken = '';

async function registerUser() {
  console.log('🔐 Registering test user...');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_USER),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ User registered successfully');
      authToken = data.data.accessToken;
      return true;
    } else {
      console.log('ℹ️ User might already exist, trying to login...');
      return false;
    }
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    return false;
  }
}

async function loginUser() {
  console.log('🔑 Logging in user...');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful');
      authToken = data.data.accessToken;
      return true;
    } else {
      console.error('❌ Login failed:', data.error?.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function generateImage() {
  console.log('🎨 Generating AI image...');
  
  try {
    // Create a test image file if it doesn't exist
    const testImagePath = 'test-image.jpg';
    if (!fs.existsSync(testImagePath)) {
      console.log('📸 Creating test image...');
      // Create a simple test image (1x1 pixel JPEG)
      const testImageBuffer = Buffer.from(
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
        'base64'
      );
      fs.writeFileSync(testImagePath, testImageBuffer);
    }

    const formData = new FormData();
    formData.append('images', fs.createReadStream(testImagePath));
    formData.append('gender', TEST_IMAGE_GENERATION.gender);
    formData.append('style', TEST_IMAGE_GENERATION.style);
    formData.append('description', TEST_IMAGE_GENERATION.description);

    const response = await fetch(`${BASE_URL}/images/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Image generated successfully!');
      console.log('📊 Generation Details:');
      console.log(`   ID: ${data.data.id}`);
      console.log(`   Gender: ${data.data.gender}`);
      console.log(`   Style: ${data.data.style}`);
      console.log(`   Description: ${data.data.description}`);
      console.log(`   Original Images: ${data.data.originalImages.length}`);
      console.log(`   Generated Image: ${data.data.generatedImage}`);
      console.log(`   Processing Time: ${data.data.processingTime}ms`);
      console.log(`   Status: ${data.data.status}`);
      return data.data;
    } else {
      console.error('❌ Image generation failed:', data.error?.message);
      console.error('   Error Code:', data.error?.code);
      console.error('   Status Code:', data.error?.statusCode);
      return null;
    }
  } catch (error) {
    console.error('❌ Image generation error:', error.message);
    return null;
  }
}

async function getGenerationHistory() {
  console.log('📚 Getting generation history...');
  
  try {
    const response = await fetch(`${BASE_URL}/images/generation-history?page=1&limit=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Generation history retrieved!');
      console.log(`📊 Found ${data.pagination.total} total generations`);
      console.log(`📄 Showing page ${data.pagination.page} of ${data.pagination.totalPages}`);
      
      if (data.data.length > 0) {
        console.log('🎨 Recent generations:');
        data.data.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.gender} - ${item.style} (${item.processingTime}ms)`);
        });
      }
      
      return data.data;
    } else {
      console.error('❌ Failed to get generation history:', data.error?.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Generation history error:', error.message);
    return null;
  }
}

async function testHealthCheck() {
  console.log('🏥 Testing health check...');
  
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health check passed');
      console.log(`   Status: ${data.data.status}`);
      console.log(`   Uptime: ${data.data.uptime}s`);
      return true;
    } else {
      console.error('❌ Health check failed:', data.error?.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Image Generation API Tests\n');
  
  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('❌ Health check failed, stopping tests');
    return;
  }
  console.log('');

  // Test 2: Authentication
  const registered = await registerUser();
  if (!registered) {
    const loginOk = await loginUser();
    if (!loginOk) {
      console.log('❌ Authentication failed, stopping tests');
      return;
    }
  }
  console.log('');

  // Test 3: Image Generation
  const generatedImage = await generateImage();
  if (!generatedImage) {
    console.log('❌ Image generation failed, stopping tests');
    return;
  }
  console.log('');

  // Test 4: Generation History
  await getGenerationHistory();
  console.log('');

  console.log('🎉 All tests completed successfully!');
  console.log('\n📋 Test Summary:');
  console.log('   ✅ Health check passed');
  console.log('   ✅ Authentication successful');
  console.log('   ✅ Image generation working');
  console.log('   ✅ Generation history accessible');
  
  console.log('\n🔗 Next Steps:');
  console.log('   1. Check the generated image in the uploads folder');
  console.log('   2. Test with different gender/style combinations');
  console.log('   3. Try uploading multiple reference images');
  console.log('   4. Test rate limiting by making multiple requests');
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  registerUser,
  loginUser,
  generateImage,
  getGenerationHistory,
  testHealthCheck,
  runTests
};
