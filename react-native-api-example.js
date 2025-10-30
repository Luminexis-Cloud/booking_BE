// React Native API Service Example
// This file shows how to integrate with the backend API from your React Native app

const API_BASE_URL = 'http://localhost:3000/api'; // Change this to your server URL

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async signup(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store token for future requests
    if (response.data?.accessToken) {
      this.setToken(response.data.accessToken);
    }

    return response;
  }

  async logout(refreshToken) {
    const response = await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    // Clear stored token
    this.clearToken();
    return response;
  }

  async refreshToken(refreshToken) {
    const response = await this.request('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    // Update stored token
    if (response.data?.accessToken) {
      this.setToken(response.data.accessToken);
    }

    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Mobile-specific methods
  async getAppVersion() {
    return this.request('/mobile/version');
  }

  async registerDevice(deviceToken, platform, appVersion) {
    return this.request('/mobile/device/register', {
      method: 'POST',
      body: JSON.stringify({
        deviceToken,
        platform,
        appVersion,
      }),
    });
  }

  async getNotificationPreferences() {
    return this.request('/mobile/notifications/preferences');
  }

  async updateNotificationPreferences(preferences) {
    return this.request('/mobile/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async getAppConfig() {
    return this.request('/mobile/config');
  }

  async checkHealth() {
    return this.request('/mobile/health');
  }
}

// Export singleton instance
export default new ApiService();

// Usage examples:
/*
import ApiService from './ApiService';

// Login
try {
  const loginResponse = await ApiService.login('user@example.com', 'password123');
  console.log('Login successful:', loginResponse.data.user);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Register device for push notifications
try {
  const deviceResponse = await ApiService.registerDevice(
    'device_push_token_here',
    'ios',
    '1.0.0'
  );
  console.log('Device registered:', deviceResponse.data.deviceId);
} catch (error) {
  console.error('Device registration failed:', error.message);
}

// Get app configuration
try {
  const configResponse = await ApiService.getAppConfig();
  console.log('App config:', configResponse.data);
} catch (error) {
  console.error('Failed to get app config:', error.message);
}
*/
