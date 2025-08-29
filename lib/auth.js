// lib/auth.js - Authentication and authorization system
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SALT_ROUNDS = 12;

// Hash password
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    subscription_tier: user.subscription_tier,
    subscription_status: user.subscription_status
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '24h',
    issuer: 'mylawmanager-api'
  });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Middleware to authenticate requests
export async function authenticateUser(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  // Get fresh user data from database
  const result = await query(
    'SELECT * FROM users WHERE id = $1 AND active = true',
    [decoded.id]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found or inactive');
  }
  
  return result.rows[0];
}

// Login function
export async function loginUser(email, password) {
  const result = await query(
    'SELECT * FROM users WHERE email = $1 AND active = true',
    [email.toLowerCase()]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }
  
  const user = result.rows[0];
  const isValidPassword = await verifyPassword(password, user.password_hash);
  
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }
  
  // Update last login
  await query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );
  
  // Generate token
  const token = generateToken(user);
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscription_tier: user.subscription_tier,
      subscription_status: user.subscription_status
    },
    token
  };
}
