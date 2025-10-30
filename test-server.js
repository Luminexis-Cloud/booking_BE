const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.post('/api/auth/signup', (req, res) => {
  const { firstName, lastName, phoneNumber } = req.body;
  
  // Simple validation
  if (!firstName || !lastName || !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [
        { field: 'firstName', message: 'First name is required' },
        { field: 'lastName', message: 'Last name is required' },
        { field: 'phoneNumber', message: 'Phone number is required' }
      ]
    });
  }

  // Mock response
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: {
        id: 'test_' + Date.now(),
        firstName,
        lastName,
        phoneNumber,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Signup endpoint: http://localhost:${PORT}/api/auth/signup`);
});
