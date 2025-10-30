const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

// Mobile-specific endpoints for React Native

// App version check
router.get('/version', (req, res) => {
  sendSuccess(res, 'App version retrieved successfully', {
    version: '1.0.0',
    minVersion: '1.0.0',
    updateRequired: false,
    updateUrl: null,
  });
});

// Device registration for push notifications
router.post('/device/register', authenticateToken, (req, res) => {
  const { deviceToken, platform, appVersion } = req.body;
  
  // Here you would typically save device info to database
  console.log('Device registered:', { deviceToken, platform, appVersion, userId: req.user.userId });
  
  sendSuccess(res, 'Device registered successfully', {
    deviceId: 'device_' + Date.now(),
  });
});

// Push notification preferences
router.get('/notifications/preferences', authenticateToken, (req, res) => {
  sendSuccess(res, 'Notification preferences retrieved', {
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    appointmentReminders: true,
    marketingEmails: false,
  });
});

router.put('/notifications/preferences', authenticateToken, (req, res) => {
  const { pushEnabled, emailEnabled, smsEnabled, appointmentReminders, marketingEmails } = req.body;
  
  // Here you would update user preferences in database
  console.log('Notification preferences updated:', { 
    userId: req.user.userId, 
    pushEnabled, 
    emailEnabled, 
    smsEnabled, 
    appointmentReminders, 
    marketingEmails 
  });
  
  sendSuccess(res, 'Notification preferences updated successfully');
});

// App configuration
router.get('/config', (req, res) => {
  sendSuccess(res, 'App configuration retrieved', {
    apiVersion: '1.0.0',
    features: {
      appointments: true,
      notifications: true,
      payments: false,
      chat: false,
    },
    limits: {
      maxAppointmentsPerDay: 10,
      maxAppointmentDuration: 120, // minutes
    },
    urls: {
      support: 'https://support.yourapp.com',
      privacy: 'https://yourapp.com/privacy',
      terms: 'https://yourapp.com/terms',
    },
  });
});

// Health check for mobile app
router.get('/health', (req, res) => {
  sendSuccess(res, 'Mobile API is healthy', {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
