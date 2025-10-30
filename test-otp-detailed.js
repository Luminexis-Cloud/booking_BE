// Detailed test script for OTP authentication flow
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testOTPFlow() {
  console.log('🧪 Testing OTP Authentication Flow...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);
    console.log('');

    // Test 2: Send OTP for Signup
    console.log('2️⃣ Testing Send OTP for Signup...');
    try {
      const sendOtpResponse = await axios.post(`${BASE_URL}/api/auth/send-signup-otp`, {
        phoneNumber: '+1234567890'
      });
      console.log('✅ Send OTP Response:', sendOtpResponse.data.message);
    } catch (error) {
      console.log('❌ Send OTP Error:', error.response?.data || error.message);
      if (error.response?.data?.errors) {
        console.log('📋 Validation Errors:', error.response.data.errors);
      }
    }
    console.log('');

    // Test 3: Check what message service is being used
    console.log('3️⃣ Checking Message Service Configuration...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Message Service:', process.env.MESSAGE_SERVICE || 'mock');
    console.log('');

    // Test 4: Try with a valid phone number format
    console.log('4️⃣ Testing with Valid Phone Number...');
    try {
      const sendOtpResponse2 = await axios.post(`${BASE_URL}/api/auth/send-signup-otp`, {
        phoneNumber: '+12345678901' // 11 digits
      });
      console.log('✅ Send OTP Response:', sendOtpResponse2.data.message);
    } catch (error) {
      console.log('❌ Send OTP Error:', error.response?.data || error.message);
      if (error.response?.data?.errors) {
        console.log('📋 Validation Errors:', error.response.data.errors);
      }
    }

  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

// Run the test
testOTPFlow();
