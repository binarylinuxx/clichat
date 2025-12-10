// Type definitions for the chat application

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: number;
  lastLogin?: number;
}

export interface Session {
  userId: string;
  username: string;
  socketId: string;
  color: string;
  loginTime: number;
}

export interface Message {
  username: string;
  message: string;
  color: string;
  timestamp: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  username?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}
