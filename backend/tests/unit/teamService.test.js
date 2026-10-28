import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamService } from '../../src/services/teamService.js';
import { ValidationError } from '../../src/utils/challengeValidator.js';

describe('TeamService Unit Tests', () => {
  let mockModel;
  let mockGeneratorService;
  let teamService;

  const sampleChallenge = {
    theme: 'EdTech',
    source: 'ai',
    problem: {
      title: 'Interactive Flashcard Trainer',
      statement: 'Students need spaced repetition to retain key concepts during revision sprints.'
    },
    restriction: {
      name: 'No Frameworks',
      rule: 'Vanilla JS, HTML, and CSS only without build tools.'
    },
    resource: {
      name: 'Web Storage API',
      type: 'browser-api',
      guidance: 'Use localStorage for progress tracking.',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage'
    },
    deliverable: 'A responsive web application with spaced repetition intervals.'
  };

  beforeEach(() => {
    mockModel = {
      findOne: vi.fn(),
      create: vi.fn()
    };
    mockGeneratorService = {
      generateChallenge: vi.fn().mockImplementation(async (theme) => ({
        ...sampleChallenge,
        theme
      }))
    };
    teamService = new TeamService({
      model: mockModel,
      generatorService: mockGeneratorService
    });
  });

  describe('Team Name Validation', () => {
    it('should reject missing or non-string team name', () => {
      expect(() => teamService.validateTeamName('')).toThrow(ValidationError);
      expect(() => teamService.validateTeamName(null)).toThrow(ValidationError);
      expect(() => teamService.validateTeamName(123)).toThrow(ValidationError);
    });

    it('should reject team names shorter than 2 characters after trimming', () => {
      expect(() => teamService.validateTeamName(' A ')).toThrow(/at least 2 characters/);
    });

    it('should reject team names longer than 50 characters', () => {
      const longName = 'A'.repeat(51);
      expect(() => teamService.validateTeamName(longName)).toThrow(/cannot exceed 50 characters/);
    });

    it('should accept valid team names and trim whitespace', () => {
      expect(teamService.validateTeamName('  Code Wizards  ')).toBe('Code Wizards');
    });
  });

  describe('Registration & Persistence Flow', () => {
    it('should register a team, generate challenge, and persist to database', async () => {
      mockModel.findOne.mockResolvedValue(null);
      const fakeSavedDoc = {
        _id: 'mock_doc_id_123',
        teamName: 'Code Wizards',
        normalizedTeamName: 'code wizards',
        theme: 'EdTech',
        challenge: {
          problem: sampleChallenge.problem,
          restriction: sampleChallenge.restriction,
          resource: sampleChallenge.resource,
          deliverable: sampleChallenge.deliverable
        },
        challengeSource: 'ai',
        challengeId: 'cts-edtech-abc1234',
        createdAt: new Date('2026-10-28T12:00:00Z')
      };
      mockModel.create.mockResolvedValue(fakeSavedDoc);

      const result = await teamService.registerTeamAndGenerate({
        teamName: 'Code Wizards',
        theme: 'EdTech'
      });

      expect(mockModel.findOne).toHaveBeenCalledWith({ normalizedTeamName: 'code wizards' });
      expect(mockGeneratorService.generateChallenge).toHaveBeenCalledWith('EdTech');
      expect(mockModel.create).toHaveBeenCalledOnce();
      expect(result.teamName).toBe('Code Wizards');
      expect(result.theme).toBe('EdTech');
      expect(result.source).toBe('ai');
      expect(result.shareText).toContain('*Team:* Code Wizards');
    });

    it('should reject duplicate team name with HTTP 409 TEAM_ALREADY_EXISTS', async () => {
      mockModel.findOne.mockResolvedValue({
        _id: 'existing_id',
        teamName: 'Code Wizards',
        theme: 'EdTech',
        challengeId: 'cts-edtech-old'
      });

      await expect(
        teamService.registerTeamAndGenerate({
          teamName: 'code wizards',
          theme: 'EdTech'
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'TEAM_ALREADY_EXISTS'
      });

      expect(mockGeneratorService.generateChallenge).not.toHaveBeenCalled();
      expect(mockModel.create).not.toHaveBeenCalled();
    });

    it('should handle MongoDB duplicate key error E11000 gracefully', async () => {
      mockModel.findOne.mockResolvedValue(null);
      const duplicateError = new Error('E11000 duplicate key error');
      duplicateError.code = 11000;
      mockModel.create.mockRejectedValue(duplicateError);

      await expect(
        teamService.registerTeamAndGenerate({
          teamName: 'Race Condition Team',
          theme: 'FinTech'
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'TEAM_ALREADY_EXISTS'
      });
    });

    it('should throw safe DATABASE_SAVE_FAILED error if DB write fails', async () => {
      mockModel.findOne.mockResolvedValue(null);
      mockModel.create.mockRejectedValue(new Error('Connection lost to replica set'));

      await expect(
        teamService.registerTeamAndGenerate({
          teamName: 'Network Dropped Team',
          theme: 'HealthTech'
        })
      ).rejects.toMatchObject({
        statusCode: 503,
        code: 'DATABASE_SAVE_FAILED'
      });
    });
  });

  describe('Retrieval Flow', () => {
    it('should retrieve existing team by normalized name', async () => {
      mockModel.findOne.mockResolvedValue({
        _id: 'team_id_555',
        teamName: 'Alpha Innovators',
        normalizedTeamName: 'alpha innovators',
        theme: 'Smart Cities',
        challengeSource: 'curated-fallback',
        challengeId: 'cts-smartcities-xyz',
        challenge: sampleChallenge,
        createdAt: new Date('2026-10-28T14:00:00Z')
      });

      const assignment = await teamService.getTeamAssignment('ALPHA INNOVATORS');
      expect(assignment.teamName).toBe('Alpha Innovators');
      expect(assignment.source).toBe('curated-fallback');
      expect(assignment.shareText).toContain('*Team:* Alpha Innovators');
    });

    it('should return 404 TEAM_NOT_FOUND if team does not exist', async () => {
      mockModel.findOne.mockResolvedValue(null);

      await expect(teamService.getTeamAssignment('Ghost Team')).rejects.toMatchObject({
        statusCode: 404,
        code: 'TEAM_NOT_FOUND'
      });
    });
  });

  describe('listTeams', () => {
    it('should filter, search, sort, and paginate teams', async () => {
      mockModel.countDocuments = vi.fn().mockResolvedValue(1);
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'team_id_101',
            teamName: 'Cyber Hawks',
            theme: 'FinTech',
            challengeId: 'cts-fintech-101',
            challengeSource: 'ai',
            challenge: sampleChallenge,
            createdAt: new Date('2026-10-28T10:00:00Z')
          }
        ])
      };
      mockModel.find = vi.fn().mockReturnValue(mockQuery);

      const result = await teamService.listTeams({
        search: 'Hawks',
        theme: 'FinTech',
        sortBy: 'teamName',
        sortOrder: 'asc',
        page: 1,
        limit: 10
      });

      expect(mockModel.countDocuments).toHaveBeenCalledWith({
        theme: 'FinTech',
        $or: [
          { teamName: { $regex: 'Hawks', $options: 'i' } },
          { 'challenge.problem.title': { $regex: 'Hawks', $options: 'i' } }
        ]
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ teamName: 1 });
      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].teamName).toBe('Cyber Hawks');
      expect(result.total).toBe(1);
    });
  });

  describe('deleteTeam', () => {
    it('should successfully delete an existing team assignment', async () => {
      mockModel.findOneAndDelete = vi.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        teamName: 'Delete Me'
      });

      const res = await teamService.deleteTeam('507f1f77bcf86cd799439011');
      expect(res.teamName).toBe('Delete Me');
      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011'
      });
    });

    it('should throw 404 when team does not exist', async () => {
      mockModel.findOneAndDelete = vi.fn().mockResolvedValue(null);

      await expect(teamService.deleteTeam('Nonexistent Team')).rejects.toThrow(/No assignment found/);
    });

    it('should throw 400 when identifier is missing', async () => {
      await expect(teamService.deleteTeam('')).rejects.toThrow(/identifier is required/);
    });
  });
});

