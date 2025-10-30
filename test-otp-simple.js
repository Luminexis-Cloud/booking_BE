// Simple OTP test to see the generated OTP
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testOTP() {
  console.log('🧪 Testing OTP Generation...\n');
  
  try {
    // Send OTP
    const response = await axios.post(`${BASE_URL}/api/auth/send-signup-otp`, {
      phoneNumber: '+12345678901'
    });
    
    console.log('✅ OTP sent successfully!');
    console.log('📱 Phone:', '+12345678901');
    console.log('📨 Message Service: Mock (Development Mode)');
    console.log('\n💡 Check the server console to see the generated OTP');
    console.log('💡 The OTP should appear as: "📱 FALLBACK OTP for +12345678901: XXXXXX"');
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

testOTP();
