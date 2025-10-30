// Test OTP with WhatsApp service
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testWhatsAppOTP() {
  console.log('🧪 Testing OTP with WhatsApp Service...\n');
  
  try {
    // Test with WhatsApp service (will fallback to mock since no credentials)
    console.log('📨 Testing WhatsApp Service (will fallback to mock)...');
    
    const response = await axios.post(`${BASE_URL}/api/auth/send-signup-otp`, {
      phoneNumber: '+12345678901'
    });
    
    console.log('✅ OTP Response:', response.data.message);
    console.log('📊 Success:', response.data.success);
    
    console.log('\n📋 Current Configuration:');
    console.log('• Environment: development');
    console.log('• Message Service: mock (default)');
    console.log('• WhatsApp Credentials: Not configured');
    console.log('• Twilio Credentials: Not configured');
    
    console.log('\n💡 To test with real WhatsApp:');
    console.log('1. Set environment variable: MESSAGE_SERVICE=whatsapp');
    console.log('2. Configure WHATSAPP_ACCESS_TOKEN');
    console.log('3. Configure WHATSAPP_PHONE_NUMBER_ID');
    console.log('4. Restart the server');
    
    console.log('\n💡 To test with real SMS:');
    console.log('1. Set environment variable: MESSAGE_SERVICE=twilio');
    console.log('2. Configure TWILIO_ACCOUNT_SID');
    console.log('3. Configure TWILIO_AUTH_TOKEN');
    console.log('4. Configure TWILIO_PHONE_NUMBER');
    console.log('5. Restart the server');
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

testWhatsAppOTP();
