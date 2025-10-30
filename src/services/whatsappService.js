// WhatsApp Business API Service
const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  async sendOtp(phoneNumber, otp) {
    try {
      // Check if credentials are provided
      if (!this.accessToken || !this.phoneNumberId) {
        console.log(`FALLBACK OTP for ${phoneNumber}: ${otp} (WhatsApp not configured)`);
        return { 
          success: true, 
          fallback: true,
          method: 'whatsapp',
          environment: 'development'
        };
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const message = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this message.`
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        message,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`WhatsApp OTP sent to ${phoneNumber}: ${otp}`);
      return { 
        success: true, 
        messageId: response.data.messages[0].id,
        method: 'whatsapp',
        environment: 'production'
      };
    } catch (error) {
      console.error('WhatsApp OTP failed:', error.response?.data || error.message);
      
      // Fallback: Log OTP for development
      console.log(`FALLBACK OTP for ${phoneNumber}: ${otp}`);
      return { 
        success: true, 
        fallback: true,
        method: 'whatsapp',
        environment: 'production'
      };
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove + and spaces
    let cleaned = phoneNumber.replace(/[+\s-]/g, '');
    
    // Add country code if not present (assuming +1 for US)
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    return cleaned;
  }
}

module.exports = new WhatsAppService();
