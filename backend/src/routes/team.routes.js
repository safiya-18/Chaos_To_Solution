import { Router } from 'express';
import teamService from '../services/teamService.js';
import requireOperatorAuth from '../middlewares/auth.js';

const router = Router();

/**
 * POST /api/teams
 * Registers a new team name, generates a challenge, and persists it to MongoDB.
 */
router.post('/', async (req, res, next) => {
  try {
    const { teamName, theme } = req.body || {};
    const result = await teamService.registerTeamAndGenerate({ teamName, theme });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/teams
 * Lists all persisted team challenge assignments with optional search, theme filtering, and sorting.
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, theme, sortBy, sortOrder, page, limit } = req.query || {};
    const result = await teamService.listTeams({ search, theme, sortBy, sortOrder, page, limit });
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/teams/:id
 * Retrieves a saved team assignment by MongoDB _id or normalized team name.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await teamService.getTeamAssignment(req.params.id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/teams/:id
 * Protected endpoint: Deletes a saved team assignment by MongoDB _id or normalized team name.
 * Requires event operator Bearer token authorization.
 */
router.delete('/:id', requireOperatorAuth, async (req, res, next) => {
  try {
    const result = await teamService.deleteTeam(req.params.id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

export default router;
