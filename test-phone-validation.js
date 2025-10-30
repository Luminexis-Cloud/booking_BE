// Test phone number validation
const { body, validationResult } = require('express-validator');

async function testPhoneValidation() {
  console.log('🧪 Testing Phone Number Validation...\n');

  const testNumbers = [
    '+1234567890',
    '+12345678901',
    '+123456789012',
    '1234567890',
    '12345678901',
    '+1-234-567-8901',
    '+1 (234) 567-8901',
    '1234567890123'
  ];

  for (const phoneNumber of testNumbers) {
    try {
      await body('phoneNumber')
        .notEmpty()
        .isMobilePhone('any')
        .withMessage('Valid phone number is required')
        .run({ body: { phoneNumber } });
      
      console.log(`✅ ${phoneNumber} - VALID`);
    } catch (error) {
      console.log(`❌ ${phoneNumber} - INVALID`);
    }
  }

  // Test with a more lenient validation
  console.log('\n🔧 Testing with lenient validation...');
  for (const phoneNumber of testNumbers) {
    try {
      await body('phoneNumber')
        .notEmpty()
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Valid phone number is required')
        .run({ body: { phoneNumber } });
      
      console.log(`✅ ${phoneNumber} - VALID (lenient)`);
    } catch (error) {
      console.log(`❌ ${phoneNumber} - INVALID (lenient)`);
    }
  }
}

testPhoneValidation();
