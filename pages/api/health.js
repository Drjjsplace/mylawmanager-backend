// pages/api/health.js - Health check endpoint
import { testConnection } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbConnected ? 'healthy' : 'unhealthy',
        api: 'healthy'
      },
      performance: {
        uptime: process.uptime(),
        response_time_ms: responseTime
      }
    };

    if (!dbConnected) {
      healthStatus.status = 'degraded';
      return res.status(503).json(healthStatus);
    }

    res.status(200).json(healthStatus);
    
  } catch (error) {
    console.error('Health check error:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      performance: {
        uptime: process.uptime(),
        response_time_ms: Date.now() - startTime
      }
    });
  }
}
