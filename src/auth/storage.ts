// Simple file-based storage for user accounts
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../types';

const STORAGE_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(STORAGE_DIR, 'users.json');

export class UserStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
    this.loadUsers();
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  private loadUsers(): void {
    this.ensureStorageDir();

    if (fs.existsSync(USERS_FILE)) {
      try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        const usersArray: User[] = JSON.parse(data);
        this.users = new Map(usersArray.map(user => [user.username.toLowerCase(), user]));
      } catch (error) {
        console.error('Error loading users:', error);
        this.users = new Map();
      }
    }
  }

  private saveUsers(): void {
    this.ensureStorageDir();

    try {
      const usersArray = Array.from(this.users.values());
      fs.writeFileSync(USERS_FILE, JSON.stringify(usersArray, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  createUser(username: string, passwordHash: string): User {
    const user: User = {
      id: this.generateUserId(),
      username,
      passwordHash,
      createdAt: Date.now()
    };

    this.users.set(username.toLowerCase(), user);
    this.saveUsers();
    return user;
  }

  getUser(username: string): User | undefined {
    return this.users.get(username.toLowerCase());
  }

  userExists(username: string): boolean {
    return this.users.has(username.toLowerCase());
  }

  updateLastLogin(username: string): void {
    const user = this.getUser(username);
    if (user) {
      user.lastLogin = Date.now();
      this.saveUsers();
    }
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  deleteUser(username: string): boolean {
    const deleted = this.users.delete(username.toLowerCase());
    if (deleted) {
      this.saveUsers();
    }
    return deleted;
  }
}
