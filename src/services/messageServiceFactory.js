// Message Service Factory - Environment-based service selection
const mockMessageService = require('./mockMessageService');
const whatsappService = require('./whatsappService');
const twilioService = require('./twilioService');

class MessageServiceFactory {
  static create() {
    const environment = process.env.NODE_ENV || 'development';
    const service = process.env.MESSAGE_SERVICE || 'mock';
    
    console.log(`Message Service: ${service} (${environment})`);
    
    switch (service) {
      case 'whatsapp':
        return whatsappService;
      case 'twilio':
        return twilioService;
      case 'mock':
      default:
        return mockMessageService;
    }
  }

  // Create with fallback support
  static createWithFallback() {
    const environment = process.env.NODE_ENV || 'development';
    
    if (environment === 'development') {
      return mockMessageService;
    }
    
    // Production: Try WhatsApp first, fallback to Twilio
    return {
      async sendOtp(phoneNumber, otp) {
        try {
          // Try WhatsApp first
          const result = await whatsappService.sendOtp(phoneNumber, otp);
          if (result.success && !result.fallback) {
            return result;
          }
        } catch (error) {
          console.log('WhatsApp failed, trying SMS...');
        }
        
        try {
          // Fallback to Twilio
          return await twilioService.sendOtp(phoneNumber, otp);
        } catch (error) {
          console.error('Both WhatsApp and SMS failed');
          throw new Error('Failed to send verification code');
        }
      }
    };
  }
}

module.exports = MessageServiceFactory;
