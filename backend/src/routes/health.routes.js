import { Router } from 'express';
import { getDBStatus } from '../config/db.js';

const router = Router();

router.get('/', (req, res) => {
  const dbStatus = getDBStatus();

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      database: dbStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

export default router;
