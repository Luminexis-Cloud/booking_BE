// Test script for OTP authentication flow
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
    const sendOtpResponse = await axios.post(`${BASE_URL}/api/auth/send-signup-otp`, {
      phoneNumber: '+1234567890'
    });
    console.log('✅ Send OTP Response:', sendOtpResponse.data.message);
    console.log('');

    // Test 3: Verify OTP and Signup
    console.log('3️⃣ Testing Verify OTP and Signup...');
    const verifyOtpResponse = await axios.post(`${BASE_URL}/api/auth/verify-signup-otp`, {
      phoneNumber: '+1234567890',
      otp: '123456', // This will fail, but we'll see the error
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123'
    });
    console.log('✅ Verify OTP Response:', verifyOtpResponse.data.message);
    console.log('');

    // Test 4: Login
    console.log('4️⃣ Testing Login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      phoneNumber: '+1234567890',
      password: 'password123'
    });
    console.log('✅ Login Response:', loginResponse.data.message);
    console.log('');

  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', error.response.data.message);
      console.log('📊 Status:', error.response.status);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

// Run the test
testOTPFlow();
