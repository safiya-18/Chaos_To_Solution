import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import teamService from '../../src/services/teamService.js';

describe('POST /api/teams (Team Registration & Persistence)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should register a team and return HTTP 201 with saved assignment', async () => {
    const mockSaved = {
      id: '507f1f77bcf86cd799439011',
      challengeId: 'cts-edtech-test123',
      teamName: 'Binary Beasts',
      theme: 'EdTech',
      generatedAt: '2026-10-28T12:00:00.000Z',
      source: 'ai',
      challenge: {
        problem: { title: 'Test Problem', statement: 'Problem statement text.' },
        restriction: { name: 'Test Restriction', rule: 'Restriction rule text.' },
        resource: {
          name: 'Web Storage API',
          type: 'browser-api',
          guidance: 'Guidance text',
          docsUrl: 'https://developer.mozilla.org'
        },
        deliverable: 'Prototype scope text.'
      },
      shareText: '⚡ *CHAOS TO SOLUTION — AI Challenge* ⚡\n👥 *Team:* Binary Beasts...'
    };

    vi.spyOn(teamService, 'registerTeamAndGenerate').mockResolvedValue(mockSaved);

    const res = await request(app)
      .post('/api/teams')
      .send({ teamName: 'Binary Beasts', theme: 'EdTech' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.teamName).toBe('Binary Beasts');
    expect(res.body.data.theme).toBe('EdTech');
    expect(res.body.data.id).toBe('507f1f77bcf86cd799439011');
  });

  it('should return HTTP 400 when teamName is missing', async () => {
    const res = await request(app)
      .post('/api/teams')
      .send({ theme: 'EdTech' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MISSING_TEAM_NAME');
  });

  it('should return HTTP 400 when theme is invalid', async () => {
    const res = await request(app)
      .post('/api/teams')
      .send({ teamName: 'Hackers', theme: 'QuantumPhysics' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_THEME');
  });

  it('should return HTTP 409 when team name is already registered', async () => {
    const duplicateErr = new Error("Team name 'Binary Beasts' is already registered for this event.");
    duplicateErr.statusCode = 409;
    duplicateErr.code = 'TEAM_ALREADY_EXISTS';

    vi.spyOn(teamService, 'registerTeamAndGenerate').mockRejectedValue(duplicateErr);

    const res = await request(app)
      .post('/api/teams')
      .send({ teamName: 'Binary Beasts', theme: 'EdTech' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TEAM_ALREADY_EXISTS');
  });

  it('should return HTTP 503 if database persistence fails', async () => {
    const dbErr = new Error('Database connection failed');
    dbErr.statusCode = 503;
    dbErr.code = 'DATABASE_SAVE_FAILED';

    vi.spyOn(teamService, 'registerTeamAndGenerate').mockRejectedValue(dbErr);

    const res = await request(app)
      .post('/api/teams')
      .send({ teamName: 'Valid Team', theme: 'FinTech' });

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DATABASE_SAVE_FAILED');
  });
});

describe('GET /api/teams/:id (Retrieve Assignment)', () => {
  it('should retrieve assignment by ID or team name with HTTP 200', async () => {
    const mockAssignment = {
      id: '507f1f77bcf86cd799439011',
      challengeId: 'cts-fintech-xyz',
      teamName: 'Crypto Coders',
      theme: 'FinTech',
      generatedAt: '2026-10-28T12:00:00.000Z',
      source: 'ai',
      challenge: {
        problem: { title: 'Split App', statement: 'Split bill calculations.' },
        restriction: { name: 'No Auth', rule: 'No logins.' },
        resource: {
          name: 'Web Storage',
          type: 'browser-api',
          guidance: 'Save locally',
          docsUrl: 'https://developer.mozilla.org'
        },
        deliverable: 'Working UI.'
      },
      shareText: '...'
    };

    vi.spyOn(teamService, 'getTeamAssignment').mockResolvedValue(mockAssignment);

    const res = await request(app).get('/api/teams/Crypto%20Coders');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.teamName).toBe('Crypto Coders');
  });

  it('should return HTTP 404 when team is not found', async () => {
    const notFoundErr = new Error("No assignment found for team identifier 'UnknownTeam'.");
    notFoundErr.statusCode = 404;
    notFoundErr.code = 'TEAM_NOT_FOUND';

    vi.spyOn(teamService, 'getTeamAssignment').mockRejectedValue(notFoundErr);

    const res = await request(app).get('/api/teams/UnknownTeam');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TEAM_NOT_FOUND');
  });
});

describe('GET /api/teams (List Saved Team Challenges)', () => {
  it('should list all team assignments with HTTP 200', async () => {
    const mockList = {
      teams: [
        {
          index: 1,
          id: '507f1f77bcf86cd799439011',
          teamName: 'Team Phoenix',
          theme: 'Sustainability',
          challenge: {
            problem: { title: 'Solar Grid', statement: 'Micro solar sharing.' },
            restriction: { name: 'LoRaWAN', rule: 'Sub-10kb payloads.' },
            resource: { name: 'Mosquitto MQTT', type: 'local-dataset', guidance: 'Pub/sub.', docsUrl: 'https://mosquitto.org' },
            deliverable: 'Live solar node dashboard.'
          },
          source: 'ai',
          generatedAt: '2026-10-28T12:00:00.000Z'
        }
      ],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1
    };

    vi.spyOn(teamService, 'listTeams').mockResolvedValue(mockList);

    const res = await request(app).get('/api/teams?search=Phoenix&theme=Sustainability');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.teams).toHaveLength(1);
    expect(res.body.data.teams[0].teamName).toBe('Team Phoenix');
    expect(teamService.listTeams).toHaveBeenCalledWith({
      search: 'Phoenix',
      theme: 'Sustainability',
      sortBy: undefined,
      sortOrder: undefined,
      page: undefined,
      limit: undefined
    });
  });
});

describe('DELETE /api/teams/:id (Delete Team Challenge Assignment)', () => {
  const TEST_ADMIN_TOKEN = 'test-secret-operator-token-xyz';

  it('should return HTTP 401 when Authorization header is missing', async () => {
    const res = await request(app).delete('/api/teams/507f1f77bcf86cd799439011');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return HTTP 401 when Authorization header is not Bearer format', async () => {
    const res = await request(app)
      .delete('/api/teams/507f1f77bcf86cd799439011')
      .set('Authorization', 'Basic 123456');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_AUTH_FORMAT');
  });

  it('should return HTTP 403 when Bearer token is invalid', async () => {
    vi.stubEnv('EVENT_ADMIN_TOKEN', TEST_ADMIN_TOKEN);

    const res = await request(app)
      .delete('/api/teams/507f1f77bcf86cd799439011')
      .set('Authorization', 'Bearer totally-invalid-token');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should delete a team assignment and return HTTP 200 when authorized by operator', async () => {
    vi.stubEnv('EVENT_ADMIN_TOKEN', TEST_ADMIN_TOKEN);
    vi.spyOn(teamService, 'deleteTeam').mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      teamName: 'Team Phoenix',
      deleted: true,
      message: "Team 'Team Phoenix' deleted successfully."
    });

    const res = await request(app)
      .delete('/api/teams/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${TEST_ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.teamName).toBe('Team Phoenix');
    expect(res.body.data.deleted).toBe(true);
    expect(teamService.deleteTeam).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('should return HTTP 404 when authorized operator attempts to delete non-existent team', async () => {
    vi.stubEnv('EVENT_ADMIN_TOKEN', TEST_ADMIN_TOKEN);
    const notFoundErr = new Error("No assignment found for team identifier 'GhostTeam'.");
    notFoundErr.statusCode = 404;
    notFoundErr.code = 'TEAM_NOT_FOUND';

    vi.spyOn(teamService, 'deleteTeam').mockRejectedValue(notFoundErr);

    const res = await request(app)
      .delete('/api/teams/GhostTeam')
      .set('Authorization', `Bearer ${TEST_ADMIN_TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TEAM_NOT_FOUND');
  });
});

