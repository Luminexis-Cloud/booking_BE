// Twilio SMS Service
const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  // Lazy initialization to avoid errors when environment variables are not set
  _initialize() {
    if (this.initialized) {
      return;
    }

    // Only initialize if credentials are provided
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        this.client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        console.log('Twilio service initialized');
      } catch (error) {
        console.warn('Twilio initialization failed:', error.message);
        this.client = null;
      }
    } else {
      console.log('Twilio credentials not provided, using fallback mode');
      this.client = null;
    }
    
    this.initialized = true;
  }

  async sendOtp(phoneNumber, otp) {
    try {
      // Initialize Twilio client if not already done
      this._initialize();
      
      if (!this.client) {
        console.log(`FALLBACK OTP for ${phoneNumber}: ${otp} (Twilio not configured)`);
        return { 
          success: true, 
          fallback: true,
          method: 'sms',
          environment: 'development'
        };
      }

      const message = await this.client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
        body: `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this message.`
      });

      console.log(`SMS OTP sent via Twilio to ${phoneNumber}: ${otp}`);
      return { 
        success: true, 
        messageId: message.sid,
        method: 'sms',
        environment: 'production'
      };
    } catch (error) {
      console.error('Twilio SMS failed:', error.message);
      console.log(`FALLBACK OTP for ${phoneNumber}: ${otp}`);
      return { 
        success: true, 
        fallback: true,
        method: 'sms',
        environment: 'production'
      };
    }
  }
}

module.exports = new TwilioService();
