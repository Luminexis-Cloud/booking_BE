const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/requestLogger');

// Import routes
const authRoutes = require('./routes/auth');
const mobileRoutes = require('./routes/mobile');
const storeRoutes = require('./routes/store');
const serviceRoutes = require('./routes/service');
const clientRoutes = require('./routes/client');
const categoryRoutes = require('./routes/category');
const appointmentRoutes = require('./routes/appointment');
// const appointmentRoutes = require('./routes/appointment'); // Commented out for now

// ✅ New routes
const employeeRoutes = require('./routes/employee');
const visibilityRoutes = require('./routes/visibilityRoutes');
const rolesRoutes = require('./routes/role');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration for React Native
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api', storeRoutes);
app.use('/api', serviceRoutes);
app.use('/api', clientRoutes);
app.use('/api', categoryRoutes);

// ✅ Added new modules
app.use('/api/employees', employeeRoutes);
app.use('/api', appointmentRoutes);
app.use('/api/visibility', visibilityRoutes);
app.use('/api/roles', rolesRoutes);

// app.use('/api', appointmentRoutes); // Commented out for now

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
