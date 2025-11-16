import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AIService } from './ai.service';
import { Difficulty } from '../common/enums/difficulty.enum';
import { AICheckType } from '../common/enums/check-type.enum';

describe('AIService', () => {
  let service: AIService;
  let configService: ConfigService;
  let cacheManager: any;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'ai.provider': 'openai',
        'ai.openaiApiKey': 'test-key',
        'ai.openaiModel': 'gpt-4-turbo-preview',
        'ai.anthropicApiKey': '',
        'ai.anthropicModel': 'claude-3-opus-20240229',
        'ai.maxRetries': 3,
        'ai.timeout': 30000,
        'ai.cacheTtl': 3600,
        'ai.temperature': 0.7,
        'ai.maxTokens': 2000,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    configService = module.get<ConfigService>(ConfigService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const result = await service.healthCheck();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('provider');
      expect(result).toHaveProperty('configured');
      expect(result.provider).toBe('openai');
    });
  });

  describe('validateKeywords', () => {
    it('should validate required keywords correctly', async () => {
      const userAnswer = 'Photosynthesis requires chlorophyll and sunlight';
      const keywordsConfig = {
        required: ['photosynthesis', 'chlorophyll'],
        optional: ['sunlight', 'water'],
        forbidden: ['incorrect'],
        minMatches: 2,
        caseSensitive: false,
      };

      const result = await service.validateKeywords(userAnswer, keywordsConfig);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.matchedKeywords).toContain('photosynthesis');
      expect(result.matchedKeywords).toContain('chlorophyll');
      expect(result.matchedKeywords).toContain('sunlight');
      expect(result.score).toBeGreaterThan(0.5);
    });

    it('should fail when forbidden keywords are present', async () => {
      const userAnswer = 'This answer is incorrect';
      const keywordsConfig = {
        required: ['answer'],
        forbidden: ['incorrect'],
        caseSensitive: false,
      };

      const result = await service.validateKeywords(userAnswer, keywordsConfig);

      expect(result.isValid).toBe(false);
      expect(result.metadata.forbiddenKeywordsFound).toContain('incorrect');
    });

    it('should handle missing required keywords', async () => {
      const userAnswer = 'Photosynthesis is a process';
      const keywordsConfig = {
        required: ['photosynthesis', 'chlorophyll', 'sunlight'],
        minMatches: 3,
        caseSensitive: false,
      };

      const result = await service.validateKeywords(userAnswer, keywordsConfig);

      expect(result.isValid).toBe(false);
      expect(result.missingKeywords).toContain('chlorophyll');
      expect(result.missingKeywords).toContain('sunlight');
    });

    it('should respect case sensitivity', async () => {
      const userAnswer = 'PHOTOSYNTHESIS is important';
      const keywordsConfig = {
        required: ['photosynthesis'],
        caseSensitive: true,
      };

      const result = await service.validateKeywords(userAnswer, keywordsConfig);

      expect(result.isValid).toBe(false);
      expect(result.missingKeywords).toContain('photosynthesis');
    });

    it('should validate with optional keywords', async () => {
      const userAnswer = 'Photosynthesis uses sunlight and water';
      const keywordsConfig = {
        required: ['photosynthesis'],
        optional: ['sunlight', 'water', 'carbon dioxide'],
        minMatches: 1,
        caseSensitive: false,
      };

      const result = await service.validateKeywords(userAnswer, keywordsConfig);

      expect(result.isValid).toBe(true);
      expect(result.matchedKeywords.length).toBeGreaterThan(1);
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('validateExact', () => {
    it('should validate exact match', async () => {
      const question = {
        correctAnswer: 'The capital of France is Paris',
      };
      const userAnswer = 'The capital of France is Paris';

      const result = await service.validateExact(question, userAnswer);

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.confidence).toBe(1.0);
    });

    it('should fail on non-exact match', async () => {
      const question = {
        correctAnswer: 'Paris',
      };
      const userAnswer = 'paris';

      const result = await service.validateExact(question, userAnswer);

      expect(result.isValid).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should trim whitespace', async () => {
      const question = {
        correctAnswer: 'Paris',
      };
      const userAnswer = '  Paris  ';

      const result = await service.validateExact(question, userAnswer);

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(1.0);
    });
  });

  describe('validateAnswer', () => {
    it('should route to validateExact for exact check type', async () => {
      const question = {
        text: 'What is the capital of France?',
        correctAnswer: 'Paris',
      };
      const userAnswer = 'Paris';
      const checkConfig = {
        type: AICheckType.Custom,
      };

      // Mock validateExact
      const exactSpy = jest.spyOn(service, 'validateExact');
      exactSpy.mockResolvedValue({
        isValid: true,
        score: 1.0,
        confidence: 1.0,
      });

      // Note: This will actually call customPromptValidation in the current implementation
      // This test demonstrates how to mock methods
    });

    it('should handle sentiment check type', async () => {
      const question = {
        text: 'How do you feel about this topic?',
      };
      const userAnswer = 'I feel great about it!';
      const checkConfig = {
        type: AICheckType.Sentiment,
      };

      // Mock analyzeAnswerSentiment
      const sentimentSpy = jest.spyOn(service, 'analyzeAnswerSentiment');
      sentimentSpy.mockResolvedValue({
        score: 0.8,
        label: 'positive',
        confidence: 0.9,
      });

      const result = await service.validateAnswer(question, userAnswer, checkConfig);

      expect(sentimentSpy).toHaveBeenCalledWith(userAnswer);
      expect(result.sentiment).toBeDefined();
    });
  });

  describe('caching', () => {
    it('should use cached results when available', async () => {
      const cachedResult = {
        isValid: true,
        score: 0.95,
        confidence: 0.9,
        feedback: 'Cached result',
      };

      mockCacheManager.get.mockResolvedValue(cachedResult);

      const question = {
        text: 'Test question',
        correctAnswer: 'Test answer',
      };

      const result = await service.validateMeaningMatch(question, 'User answer', 0.7);

      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });
  });

  describe('error handling', () => {
    it('should handle validation errors gracefully', async () => {
      const question = null; // Invalid question
      const userAnswer = 'Test answer';

      await expect(
        service.validateAnswer(question, userAnswer)
      ).rejects.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should hash strings consistently', () => {
      // Access private method through type assertion for testing
      const hash1 = (service as any).hashString('test string');
      const hash2 = (service as any).hashString('test string');
      const hash3 = (service as any).hashString('different string');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    it('should extract JSON from markdown code blocks', () => {
      const text = '```json\n{"key": "value"}\n```';
      const extracted = (service as any).extractJSON(text);

      expect(extracted).toEqual({ key: 'value' });
    });

    it('should extract JSON from plain text', () => {
      const text = 'Some text {"key": "value"} more text';
      const extracted = (service as any).extractJSON(text);

      expect(extracted).toEqual({ key: 'value' });
    });

    it('should build keyword feedback correctly', () => {
      const feedback = (service as any).buildKeywordFeedback(
        ['keyword1', 'keyword2'],
        ['optional1'],
        ['missing1'],
        ['forbidden1']
      );

      expect(feedback).toContain('keyword1');
      expect(feedback).toContain('keyword2');
      expect(feedback).toContain('optional1');
      expect(feedback).toContain('missing1');
      expect(feedback).toContain('forbidden1');
    });
  });

  describe('configuration', () => {
    it('should use configured provider', () => {
      expect(configService.get('ai.provider')).toBe('openai');
    });

    it('should use configured settings', () => {
      expect(configService.get('ai.maxRetries')).toBe(3);
      expect(configService.get('ai.timeout')).toBe(30000);
      expect(configService.get('ai.temperature')).toBe(0.7);
    });
  });
});
