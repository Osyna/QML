import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Configuration } from '../config/configuration';
import {
  ValidationResult,
  GeneratedQuestion,
  FeedbackResult,
  SentimentResult,
} from './dto/validation-result.dto';
import { Difficulty } from '../common/enums/difficulty.enum';
import { AICheckType } from '../common/enums/check-type.enum';

export interface KeywordsConfig {
  required?: string[];
  optional?: string[];
  forbidden?: string[];
  minMatches?: number;
  caseSensitive?: boolean;
}

export interface CheckConfig {
  type?: AICheckType;
  sensitivity?: number; // 0-1, how strict the matching should be
  keywords?: KeywordsConfig;
  customPrompt?: string;
  expectedAnswer?: string;
  rubric?: string[];
  minConfidence?: number;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private readonly provider: 'openai' | 'anthropic';
  private readonly maxRetries: number;
  private readonly timeout: number;
  private readonly cacheTtl: number;
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.provider = this.configService.get<'openai' | 'anthropic'>('ai.provider', 'openai');
    this.maxRetries = this.configService.get<number>('ai.maxRetries', 3);
    this.timeout = this.configService.get<number>('ai.timeout', 30000);
    this.cacheTtl = this.configService.get<number>('ai.cacheTtl', 3600);
    this.temperature = this.configService.get<number>('ai.temperature', 0.7);
    this.maxTokens = this.configService.get<number>('ai.maxTokens', 2000);

    this.initializeClients();
  }

  private initializeClients(): void {
    try {
      if (this.provider === 'openai') {
        const apiKey = this.configService.get<string>('ai.openaiApiKey', '');
        if (!apiKey) {
          this.logger.warn('OpenAI API key not configured');
          return;
        }
        this.openaiClient = new OpenAI({
          apiKey,
          timeout: this.timeout,
          maxRetries: this.maxRetries,
        });
        this.logger.log('OpenAI client initialized successfully');
      } else if (this.provider === 'anthropic') {
        const apiKey = this.configService.get<string>('ai.anthropicApiKey', '');
        if (!apiKey) {
          this.logger.warn('Anthropic API key not configured');
          return;
        }
        this.anthropicClient = new Anthropic({
          apiKey,
          timeout: this.timeout,
          maxRetries: this.maxRetries,
        });
        this.logger.log('Anthropic client initialized successfully');
      }
    } catch (error) {
      this.logger.error('Failed to initialize AI clients', error.stack);
    }
  }

  /**
   * Main validation method that orchestrates different validation types
   */
  async validateAnswer(
    question: any,
    userAnswer: string,
    checkConfig: CheckConfig = {},
  ): Promise<ValidationResult> {
    try {
      const { type = AICheckType.Meaning, sensitivity = 0.7 } = checkConfig;

      switch (type) {
        case AICheckType.Meaning:
          return await this.validateMeaningMatch(question, userAnswer, sensitivity);

        case AICheckType.Sentiment:
          const sentiment = await this.analyzeAnswerSentiment(userAnswer);
          return {
            isValid: sentiment.score >= 0,
            score: (sentiment.score + 1) / 2, // Convert from -1,1 to 0,1
            confidence: sentiment.confidence,
            sentiment,
            feedback: `Sentiment: ${sentiment.label}`,
          };

        case AICheckType.Custom:
          if (!checkConfig.customPrompt) {
            throw new BadRequestException('Custom prompt required for custom validation');
          }
          return await this.customPromptValidation(
            userAnswer,
            checkConfig.customPrompt,
            checkConfig,
          );

        default:
          return await this.validateMeaningMatch(question, userAnswer, sensitivity);
      }
    } catch (error) {
      this.logger.error('Error in validateAnswer', error.stack);
      throw new InternalServerErrorException('Failed to validate answer');
    }
  }

  /**
   * AI-based semantic meaning comparison
   */
  async validateMeaningMatch(
    question: any,
    userAnswer: string,
    sensitivity: number = 0.7,
  ): Promise<ValidationResult> {
    const cacheKey = `ai:validate:${this.hashString(question.text + userAnswer + sensitivity)}`;

    try {
      // Check cache first
      const cached = await this.cacheManager.get<ValidationResult>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached validation result');
        return cached;
      }

      const questionText = question.text || question.content?.text || '';
      const expectedAnswer = question.correctAnswer ||
                            question.content?.correctAnswer ||
                            question.content?.answers?.find((a: any) => a.isCorrect)?.answerText ||
                            '';

      const prompt = this.buildMeaningValidationPrompt(
        questionText,
        expectedAnswer,
        userAnswer,
        sensitivity,
        question.content?.rubric,
      );

      const aiResponse = await this.callAI(prompt);
      const result = this.parseMeaningValidationResponse(aiResponse, sensitivity);

      // Cache the result
      await this.cacheManager.set(cacheKey, result, this.cacheTtl * 1000);

      this.logger.log(`Validation completed: ${result.isValid ? 'valid' : 'invalid'} (score: ${result.score})`);

      return result;
    } catch (error) {
      this.logger.error('Error in validateMeaningMatch', error.stack);
      throw new InternalServerErrorException('Failed to validate meaning match');
    }
  }

  /**
   * Keyword-based validation
   */
  async validateKeywords(
    userAnswer: string,
    keywordsConfig: KeywordsConfig,
  ): Promise<ValidationResult> {
    try {
      const {
        required = [],
        optional = [],
        forbidden = [],
        minMatches = required.length,
        caseSensitive = false,
      } = keywordsConfig;

      const answer = caseSensitive ? userAnswer : userAnswer.toLowerCase();
      const matchedRequired: string[] = [];
      const matchedOptional: string[] = [];
      const matchedForbidden: string[] = [];
      const missingRequired: string[] = [];

      // Check required keywords
      for (const keyword of required) {
        const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
        if (answer.includes(searchKeyword)) {
          matchedRequired.push(keyword);
        } else {
          missingRequired.push(keyword);
        }
      }

      // Check optional keywords
      for (const keyword of optional) {
        const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
        if (answer.includes(searchKeyword)) {
          matchedOptional.push(keyword);
        }
      }

      // Check forbidden keywords
      for (const keyword of forbidden) {
        const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
        if (answer.includes(searchKeyword)) {
          matchedForbidden.push(keyword);
        }
      }

      const totalMatched = matchedRequired.length + matchedOptional.length;
      const totalPossible = required.length + optional.length;
      const score = totalPossible > 0 ? totalMatched / totalPossible : 0;

      const isValid =
        matchedRequired.length >= minMatches &&
        matchedForbidden.length === 0;

      const feedback = this.buildKeywordFeedback(
        matchedRequired,
        matchedOptional,
        missingRequired,
        matchedForbidden,
      );

      return {
        isValid,
        score,
        confidence: 1.0, // Keyword matching has perfect confidence
        feedback,
        matchedKeywords: [...matchedRequired, ...matchedOptional],
        missingKeywords: missingRequired,
        metadata: {
          forbiddenKeywordsFound: matchedForbidden,
          requiredMatched: matchedRequired.length,
          requiredTotal: required.length,
          optionalMatched: matchedOptional.length,
          optionalTotal: optional.length,
        },
      };
    } catch (error) {
      this.logger.error('Error in validateKeywords', error.stack);
      throw new InternalServerErrorException('Failed to validate keywords');
    }
  }

  /**
   * Exact match validation
   */
  async validateExact(question: any, userAnswer: string): Promise<ValidationResult> {
    try {
      const expectedAnswer =
        question.correctAnswer ||
        question.content?.correctAnswer ||
        question.content?.answers?.find((a: any) => a.isCorrect)?.answerText ||
        '';

      const isValid = userAnswer.trim() === expectedAnswer.trim();
      const score = isValid ? 1.0 : 0.0;

      return {
        isValid,
        score,
        confidence: 1.0,
        feedback: isValid
          ? 'Your answer matches exactly!'
          : `Expected exact match: "${expectedAnswer}"`,
      };
    } catch (error) {
      this.logger.error('Error in validateExact', error.stack);
      throw new InternalServerErrorException('Failed to validate exact match');
    }
  }

  /**
   * Custom prompt validation using AI
   */
  async customPromptValidation(
    userAnswer: string,
    customPrompt: string,
    checkConfig: CheckConfig = {},
  ): Promise<ValidationResult> {
    const cacheKey = `ai:custom:${this.hashString(customPrompt + userAnswer)}`;

    try {
      const cached = await this.cacheManager.get<ValidationResult>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached custom validation result');
        return cached;
      }

      const prompt = `${customPrompt}

User's Answer: "${userAnswer}"

Please evaluate this answer and respond in JSON format with:
{
  "isValid": boolean,
  "score": number (0-1),
  "confidence": number (0-1),
  "feedback": "string",
  "reasoning": "string"
}`;

      const aiResponse = await this.callAI(prompt);
      const result = this.parseCustomValidationResponse(
        aiResponse,
        checkConfig.minConfidence || 0.7,
      );

      await this.cacheManager.set(cacheKey, result, this.cacheTtl * 1000);

      return result;
    } catch (error) {
      this.logger.error('Error in customPromptValidation', error.stack);
      throw new InternalServerErrorException('Failed to execute custom validation');
    }
  }

  /**
   * Generate questions using AI
   */
  async generateQuestions(
    topic: string,
    count: number = 1,
    difficulty: Difficulty = Difficulty.Medium,
    type: string = 'multiple_choice',
  ): Promise<GeneratedQuestion[]> {
    const cacheKey = `ai:generate:${this.hashString(topic + count + difficulty + type)}`;

    try {
      const cached = await this.cacheManager.get<GeneratedQuestion[]>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached generated questions');
        return cached;
      }

      const prompt = this.buildQuestionGenerationPrompt(topic, count, difficulty, type);
      const aiResponse = await this.callAI(prompt);
      const questions = this.parseGeneratedQuestions(aiResponse);

      await this.cacheManager.set(cacheKey, questions, this.cacheTtl * 1000);

      this.logger.log(`Generated ${questions.length} questions on topic: ${topic}`);

      return questions;
    } catch (error) {
      this.logger.error('Error in generateQuestions', error.stack);
      throw new InternalServerErrorException('Failed to generate questions');
    }
  }

  /**
   * Generate personalized feedback based on attempt history
   */
  async generateFeedback(
    attempt: any,
    submissions: any[],
  ): Promise<FeedbackResult> {
    try {
      const prompt = this.buildFeedbackPrompt(attempt, submissions);
      const aiResponse = await this.callAI(prompt);
      const feedback = this.parseFeedbackResponse(aiResponse);

      this.logger.log('Generated personalized feedback');

      return feedback;
    } catch (error) {
      this.logger.error('Error in generateFeedback', error.stack);
      throw new InternalServerErrorException('Failed to generate feedback');
    }
  }

  /**
   * Adjust question difficulty using AI
   */
  async improveDifficulty(
    question: any,
    targetDifficulty: Difficulty,
  ): Promise<any> {
    try {
      const prompt = this.buildDifficultyAdjustmentPrompt(question, targetDifficulty);
      const aiResponse = await this.callAI(prompt);
      const improvedQuestion = this.parseImprovedQuestion(aiResponse);

      this.logger.log(`Adjusted question difficulty to ${targetDifficulty}`);

      return improvedQuestion;
    } catch (error) {
      this.logger.error('Error in improveDifficulty', error.stack);
      throw new InternalServerErrorException('Failed to adjust question difficulty');
    }
  }

  /**
   * Analyze sentiment of an answer
   */
  async analyzeAnswerSentiment(answer: string): Promise<SentimentResult> {
    const cacheKey = `ai:sentiment:${this.hashString(answer)}`;

    try {
      const cached = await this.cacheManager.get<SentimentResult>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached sentiment result');
        return cached;
      }

      const prompt = `Analyze the sentiment and emotional tone of the following text.
Provide a detailed sentiment analysis in JSON format.

Text: "${answer}"

Respond with:
{
  "score": number (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive),
  "label": "negative" | "neutral" | "positive",
  "confidence": number (0-1),
  "emotions": {
    "joy": number (0-1),
    "sadness": number (0-1),
    "anger": number (0-1),
    "fear": number (0-1),
    "surprise": number (0-1)
  }
}`;

      const aiResponse = await this.callAI(prompt);
      const sentiment = this.parseSentimentResponse(aiResponse);

      await this.cacheManager.set(cacheKey, sentiment, this.cacheTtl * 1000);

      return sentiment;
    } catch (error) {
      this.logger.error('Error in analyzeAnswerSentiment', error.stack);
      throw new InternalServerErrorException('Failed to analyze sentiment');
    }
  }

  /**
   * Core AI call method with retry logic
   */
  private async callAI(prompt: string, retryCount: number = 0): Promise<string> {
    try {
      if (this.provider === 'openai' && this.openaiClient) {
        return await this.callOpenAI(prompt);
      } else if (this.provider === 'anthropic' && this.anthropicClient) {
        return await this.callAnthropic(prompt);
      } else {
        throw new InternalServerErrorException('AI provider not configured');
      }
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(`AI call failed, retrying (${retryCount + 1}/${this.maxRetries})`);
        await this.delay(1000 * Math.pow(2, retryCount)); // Exponential backoff
        return this.callAI(prompt, retryCount + 1);
      }

      this.logger.error('AI call failed after retries', error.stack);
      throw error;
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const model = this.configService.get<string>('ai.openaiModel', 'gpt-4-turbo-preview');

      const completion = await this.openaiClient.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational assessment AI assistant. Provide accurate, helpful, and constructive feedback.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      this.logger.debug('OpenAI API call successful');

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('OpenAI API call failed', error.stack);
      throw new InternalServerErrorException('OpenAI API call failed');
    }
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(prompt: string): Promise<string> {
    try {
      const model = this.configService.get<string>('ai.anthropicModel', 'claude-3-opus-20240229');

      const message = await (this.anthropicClient as any).messages.create({
        model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      this.logger.debug('Anthropic API call successful');

      const content = message.content[0];
      return content.type === 'text' ? content.text : '';
    } catch (error) {
      this.logger.error('Anthropic API call failed', error.stack);
      throw new InternalServerErrorException('Anthropic API call failed');
    }
  }

  // Helper methods for building prompts

  private buildMeaningValidationPrompt(
    question: string,
    expectedAnswer: string,
    userAnswer: string,
    sensitivity: number,
    rubric?: string[],
  ): string {
    const rubricSection = rubric?.length
      ? `\n\nEvaluation Rubric:\n${rubric.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
      : '';

    return `You are evaluating a student's answer to a question.

Question: "${question}"
Expected Answer: "${expectedAnswer}"
Student's Answer: "${userAnswer}"
${rubricSection}

Sensitivity Level: ${sensitivity} (0 = lenient, 1 = strict)

Evaluate whether the student's answer conveys the same meaning as the expected answer.
Consider:
- Semantic similarity
- Key concepts covered
- Factual accuracy
- Completeness of the answer

Respond in JSON format:
{
  "isValid": boolean,
  "score": number (0-1, representing how well the answer matches),
  "confidence": number (0-1, your confidence in this assessment),
  "feedback": "constructive feedback for the student",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "reasoning": "explanation of your assessment"
}`;
  }

  private buildQuestionGenerationPrompt(
    topic: string,
    count: number,
    difficulty: Difficulty,
    type: string,
  ): string {
    return `Generate ${count} educational question(s) about: "${topic}"

Requirements:
- Question Type: ${type}
- Difficulty Level: ${difficulty}
- Include correct answer(s)
- For multiple choice, provide 4 answer options
- Include hints and explanations
- Tag with relevant keywords

Respond with a JSON array of questions in this format:
[
  {
    "text": "question text",
    "type": "${type}",
    "difficulty": "${difficulty}",
    "category": "auto-generated category",
    "points": suggested_points,
    "correctAnswer": "correct answer or array of correct answers",
    "answers": [
      {"answerText": "option A", "isCorrect": true, "explanation": "why this is correct"},
      {"answerText": "option B", "isCorrect": false, "explanation": "why this is wrong"}
    ],
    "hints": ["hint 1", "hint 2"],
    "explanation": "detailed explanation",
    "tags": ["tag1", "tag2"]
  }
]`;
  }

  private buildFeedbackPrompt(attempt: any, submissions: any[]): string {
    const submissionsText = submissions
      .map((s, i) => `Question ${i + 1}: ${s.isCorrect ? 'Correct' : 'Incorrect'} (Score: ${s.score})`)
      .join('\n');

    return `Generate personalized feedback for a student's questionnaire attempt.

Overall Score: ${attempt.score}/${attempt.totalPoints}
Time Spent: ${attempt.timeSpent} seconds
Completion Status: ${attempt.status}

Individual Answers:
${submissionsText}

Provide constructive feedback in JSON format:
{
  "overallFeedback": "general summary of performance",
  "strengths": ["strength 1", "strength 2"],
  "areasForImprovement": ["area 1", "area 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "progressAnalysis": "analysis of progress and patterns",
  "nextSteps": ["suggested next step 1", "suggested next step 2"],
  "score": overall_score_out_of_100
}`;
  }

  private buildDifficultyAdjustmentPrompt(question: any, targetDifficulty: Difficulty): string {
    return `Adjust the following question to match the target difficulty level.

Current Question:
Type: ${question.type}
Difficulty: ${question.difficulty}
Text: ${question.content?.text || question.text}

Target Difficulty: ${targetDifficulty}

Modify the question to match the target difficulty while maintaining the same general topic.
For higher difficulty: add complexity, nuance, or require deeper understanding
For lower difficulty: simplify language, reduce ambiguity, or make more straightforward

Respond with the improved question in JSON format:
{
  "text": "adjusted question text",
  "difficulty": "${targetDifficulty}",
  "content": {original content structure with updates},
  "explanation": "what changes were made and why"
}`;
  }

  // Helper methods for parsing AI responses

  private parseMeaningValidationResponse(response: string, sensitivity: number): ValidationResult {
    try {
      const parsed = this.extractJSON(response);

      // Adjust threshold based on sensitivity
      const threshold = 0.5 + (sensitivity * 0.3); // 0.5-0.8 range

      return {
        isValid: parsed.isValid && parsed.score >= threshold,
        score: parsed.score || 0,
        confidence: parsed.confidence || 0.5,
        feedback: parsed.feedback || 'No feedback provided',
        suggestions: parsed.suggestions || [],
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      this.logger.error('Failed to parse meaning validation response', error.stack);
      return {
        isValid: false,
        score: 0,
        confidence: 0,
        feedback: 'Failed to validate answer',
      };
    }
  }

  private parseCustomValidationResponse(response: string, minConfidence: number): ValidationResult {
    try {
      const parsed = this.extractJSON(response);

      return {
        isValid: parsed.isValid && (parsed.confidence || 1) >= minConfidence,
        score: parsed.score || 0,
        confidence: parsed.confidence || 0.5,
        feedback: parsed.feedback || 'No feedback provided',
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      this.logger.error('Failed to parse custom validation response', error.stack);
      return {
        isValid: false,
        score: 0,
        confidence: 0,
        feedback: 'Failed to validate answer',
      };
    }
  }

  private parseGeneratedQuestions(response: string): GeneratedQuestion[] {
    try {
      const parsed = this.extractJSON(response);
      const questions = Array.isArray(parsed) ? parsed : [parsed];

      return questions.map(q => ({
        text: q.text || '',
        type: q.type || 'multiple_choice',
        difficulty: q.difficulty || 'medium',
        category: q.category,
        points: q.points,
        correctAnswer: q.correctAnswer,
        answers: q.answers,
        hints: q.hints,
        explanation: q.explanation,
        tags: q.tags,
        metadata: q,
      }));
    } catch (error) {
      this.logger.error('Failed to parse generated questions', error.stack);
      return [];
    }
  }

  private parseFeedbackResponse(response: string): FeedbackResult {
    try {
      const parsed = this.extractJSON(response);

      return {
        overallFeedback: parsed.overallFeedback || '',
        strengths: parsed.strengths || [],
        areasForImprovement: parsed.areasForImprovement || [],
        recommendations: parsed.recommendations || [],
        progressAnalysis: parsed.progressAnalysis,
        nextSteps: parsed.nextSteps,
        score: parsed.score,
        metadata: parsed,
      };
    } catch (error) {
      this.logger.error('Failed to parse feedback response', error.stack);
      return {
        overallFeedback: 'Unable to generate feedback',
        strengths: [],
        areasForImprovement: [],
        recommendations: [],
      };
    }
  }

  private parseImprovedQuestion(response: string): any {
    try {
      return this.extractJSON(response);
    } catch (error) {
      this.logger.error('Failed to parse improved question', error.stack);
      throw new InternalServerErrorException('Failed to parse improved question');
    }
  }

  private parseSentimentResponse(response: string): SentimentResult {
    try {
      const parsed = this.extractJSON(response);

      return {
        score: parsed.score || 0,
        label: parsed.label || 'neutral',
        confidence: parsed.confidence || 0.5,
        emotions: parsed.emotions,
        metadata: parsed,
      };
    } catch (error) {
      this.logger.error('Failed to parse sentiment response', error.stack);
      return {
        score: 0,
        label: 'neutral',
        confidence: 0,
      };
    }
  }

  // Utility methods

  private buildKeywordFeedback(
    matchedRequired: string[],
    matchedOptional: string[],
    missingRequired: string[],
    matchedForbidden: string[],
  ): string {
    const parts: string[] = [];

    if (matchedRequired.length > 0) {
      parts.push(`Matched required keywords: ${matchedRequired.join(', ')}`);
    }

    if (missingRequired.length > 0) {
      parts.push(`Missing required keywords: ${missingRequired.join(', ')}`);
    }

    if (matchedOptional.length > 0) {
      parts.push(`Matched optional keywords: ${matchedOptional.join(', ')}`);
    }

    if (matchedForbidden.length > 0) {
      parts.push(`Found forbidden keywords: ${matchedForbidden.join(', ')}`);
    }

    return parts.join('. ');
  }

  private extractJSON(text: string): any {
    // Try to extract JSON from markdown code blocks
    const jsonBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
    if (jsonBlockMatch) {
      return JSON.parse(jsonBlockMatch[1]);
    }

    // Try to find JSON object or array in the text
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // If no JSON found, try parsing the entire text
    return JSON.parse(text);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check method to verify AI service is operational
   */
  async healthCheck(): Promise<{
    status: string;
    provider: string;
    configured: boolean;
  }> {
    return {
      status: (this.openaiClient || this.anthropicClient) ? 'healthy' : 'not_configured',
      provider: this.provider,
      configured: !!(this.openaiClient || this.anthropicClient),
    };
  }
}
