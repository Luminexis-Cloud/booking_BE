// Mock Message Service for Development
class MockMessageService {
  async sendOtp(phoneNumber, otp) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Log with clean formatting
    console.log('\n' + '='.repeat(60));
    console.log('WHATSAPP MESSAGE SENT (MOCK)');
    console.log('='.repeat(60));
    console.log(`To: ${phoneNumber}`);
    console.log(`OTP: ${otp}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log(`Message: "Your verification code is: ${otp}"`);
    console.log('='.repeat(60) + '\n');
    
    return { 
      success: true, 
      messageId: 'mock_' + Date.now(),
      method: 'whatsapp',
      environment: 'development'
    };
  }
}

module.exports = new MockMessageService();
