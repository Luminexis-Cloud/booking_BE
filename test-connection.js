// Test script to verify frontend-backend connection
const axios = require('axios');

const BACKEND_URL = 'http://192.168.100.106:3000';

async function testConnection() {
  console.log('🔍 Testing connection to backend...');
  console.log(`📍 Backend URL: ${BACKEND_URL}`);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test CORS preflight
    console.log('\n2. Testing CORS configuration...');
    const corsResponse = await axios.options(`${BACKEND_URL}/api/auth/signup`, {
      headers: {
        'Origin': 'http://192.168.100.106:8081',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('✅ CORS preflight passed:', corsResponse.status);
    
    // Test API endpoint (should return 400 for missing data, but connection should work)
    console.log('\n3. Testing API endpoint...');
    try {
      await axios.post(`${BACKEND_URL}/api/auth/signup`, {});
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ API endpoint accessible (400 error expected for empty payload)');
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 All tests passed! Frontend should be able to connect to backend.');
    console.log('\n📱 To test from your React Native app:');
    console.log('   1. Start the backend: cd backend && npm run dev');
    console.log('   2. Start the frontend: cd begin && npm start');
    console.log('   3. The app should now connect to http://192.168.100.106:3000');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend is running:');
      console.log('   cd backend && npm run dev');
    }
    process.exit(1);
  }
}

testConnection();
