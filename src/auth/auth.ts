// Authentication utilities using the existing format.js encoder
import { UserStorage } from './storage';
import { AuthResponse } from '../types';

// Import the existing encoder from format.js
const { encode, decode } = require('../../format.js');

export class AuthManager {
  private storage: UserStorage;

  constructor() {
    this.storage = new UserStorage();
  }

  register(username: string, password: string): AuthResponse {
    // Validate username
    if (!username || username.trim().length < 3) {
      return {
        success: false,
        message: 'Username must be at least 3 characters long'
      };
    }

    if (!password || password.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long'
      };
    }

    // Check if user already exists
    if (this.storage.userExists(username)) {
      return {
        success: false,
        message: 'Username already exists'
      };
    }

    try {
      // Hash password using the existing encoder
      const passwordHash = encode(password);

      // Create user
      this.storage.createUser(username.trim(), passwordHash);

      return {
        success: true,
        message: 'Account created successfully',
        username: username.trim()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error creating account'
      };
    }
  }

  login(username: string, password: string): AuthResponse {
    if (!username || !password) {
      return {
        success: false,
        message: 'Username and password are required'
      };
    }

    const user = this.storage.getUser(username);

    if (!user) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }

    try {
      // Verify password using the existing encoder
      const passwordHash = encode(password);

      if (passwordHash !== user.passwordHash) {
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      // Update last login
      this.storage.updateLastLogin(username);

      return {
        success: true,
        message: 'Login successful',
        username: user.username
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error during login'
      };
    }
  }

  userExists(username: string): boolean {
    return this.storage.userExists(username);
  }
}
