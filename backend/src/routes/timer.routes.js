import { Router } from 'express';
import timerService from '../services/timerService.js';
import requireOperatorAuth from '../middlewares/auth.js';

const router = Router();

/**
 * GET /api/event-timer
 * Public endpoint: Returns the authoritative shared event timer state.
 */
router.get('/', async (req, res, next) => {
  try {
    const state = await timerService.getState();
    res.status(200).json({
      success: true,
      data: state
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/event-timer/start
 * Protected endpoint: Starts the shared event timer.
 */
router.post('/start', requireOperatorAuth, async (req, res, next) => {
  try {
    const state = await timerService.start();
    res.status(200).json({
      success: true,
      data: state
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/event-timer/pause
 * Protected endpoint: Pauses the shared event timer.
 */
router.post('/pause', requireOperatorAuth, async (req, res, next) => {
  try {
    const state = await timerService.pause();
    res.status(200).json({
      success: true,
      data: state
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/event-timer/resume
 * Protected endpoint: Resumes a paused event timer.
 */
router.post('/resume', requireOperatorAuth, async (req, res, next) => {
  try {
    const state = await timerService.resume();
    res.status(200).json({
      success: true,
      data: state
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/event-timer/reset
 * Protected endpoint: Resets the event timer back to not_started.
 */
router.post('/reset', requireOperatorAuth, async (req, res, next) => {
  try {
    const customDuration = req.body?.durationMs ? parseInt(req.body.durationMs, 10) : null;
    const state = await timerService.reset(undefined, customDuration);
    res.status(200).json({
      success: true,
      data: state
    });
  } catch (err) {
    next(err);
  }
});

export default router;
