// lib/db.js - Database connection and configuration
import { Pool } from 'pg';

// Database configuration
const dbConfig = {
  host: 'mylawmanager-prod-db.cj4k46wie826.us-east-2.rds.amazonaws.com',
  port: 5432,
  database: 'lawlibrary',
  user: 'postgres',
  password: process.env.DATABASE_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Database connection helper
export async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Test database connection
export async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Close database pool (for graceful shutdown)
export async function closePool() {
  await pool.end();
}
