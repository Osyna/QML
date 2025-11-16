import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, Between } from 'typeorm';
import { QuestionnaireAttempt, AttemptStatus, AttemptResult } from './entities/questionnaire-attempt.entity';
import { AnswerSubmission, ValidationStatus, ValidationResult } from './entities/answer-submission.entity';
import { QuestionnaireService } from '../questionnaire/questionnaire.service';
import { QuestionService } from '../question/question.service';
import { Question, AICheckConfig, KeywordsCheckConfig } from '../question/entities/question.entity';
import { CheckType } from '../common/enums';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { AIService } from '../ai/ai.service';
import {
  StartQuestionnaireDto,
  SubmitAnswerDto,
  CompleteQuestionnaireDto,
  QueryAttemptDto,
  AttemptResponseDto,
  AnswerSubmissionResponseDto,
} from './dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class AnswerService {
  constructor(
    @InjectRepository(QuestionnaireAttempt)
    private readonly attemptRepository: Repository<QuestionnaireAttempt>,
    @InjectRepository(AnswerSubmission)
    private readonly submissionRepository: Repository<AnswerSubmission>,
    private readonly questionnaireService: QuestionnaireService,
    private readonly questionService: QuestionService,
    private readonly aiService: AIService,
  ) {}

  /**
   * Start a new questionnaire attempt
   */
  async startQuestionnaire(
    userId: number,
    startDto: StartQuestionnaireDto,
  ): Promise<AttemptResponseDto> {
    const { questionnaireId, metadata } = startDto;

    // Validate questionnaire exists and is available
    const questionnaire = await this.questionnaireService.findOne(questionnaireId);
    const availability = await this.questionnaireService.validateAvailability(questionnaireId);

    if (!availability.available) {
      throw new BadRequestException(availability.reason || 'Questionnaire is not available');
    }

    // Check if user has an in-progress attempt
    const existingAttempt = await this.attemptRepository.findOne({
      where: {
        user_id: userId,
        questionnaire_id: questionnaireId,
        status: AttemptStatus.InProgress,
      },
    });

    if (existingAttempt) {
      throw new BadRequestException(
        'You already have an in-progress attempt for this questionnaire. Please complete or abandon it first.',
      );
    }

    // Check retake limits
    if (!questionnaire.settings?.allowRetake) {
      const completedAttempts = await this.attemptRepository.count({
        where: {
          user_id: userId,
          questionnaire_id: questionnaireId,
          status: AttemptStatus.Completed,
        },
      });

      if (completedAttempts > 0) {
        throw new BadRequestException('Retakes are not allowed for this questionnaire');
      }
    } else if (questionnaire.settings?.maxRetakes) {
      const totalAttempts = await this.attemptRepository.count({
        where: {
          user_id: userId,
          questionnaire_id: questionnaireId,
        },
      });

      if (totalAttempts >= questionnaire.settings.maxRetakes) {
        throw new BadRequestException(
          `Maximum number of attempts (${questionnaire.settings.maxRetakes}) reached`,
        );
      }
    }

    // Create new attempt
    const attempt = this.attemptRepository.create({
      user_id: userId,
      questionnaire_id: questionnaireId,
      status: AttemptStatus.InProgress,
      result: AttemptResult.Pending,
      metadata: metadata || {},
    });

    const savedAttempt = await this.attemptRepository.save(attempt);

    return this.getAttempt(savedAttempt.id, userId);
  }

  /**
   * Submit an answer to a question
   */
  async submitAnswer(
    userId: number,
    submitDto: SubmitAnswerDto,
  ): Promise<AnswerSubmissionResponseDto> {
    const { attemptId, questionId, userAnswer, hintsUsed, timeSpent, flaggedForReview } = submitDto;

    // Validate attempt exists and belongs to user
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId, user_id: userId },
      relations: ['questionnaire'],
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found or does not belong to you');
    }

    if (attempt.status !== AttemptStatus.InProgress) {
      throw new BadRequestException('Cannot submit answers to a completed or abandoned attempt');
    }

    // Validate question exists and belongs to questionnaire
    const question = await this.questionService.findOne(questionId);
    const questionnaireQuestions = await this.questionnaireService.getQuestions(
      attempt.questionnaire_id,
    );
    const isQuestionInQuestionnaire = questionnaireQuestions.some((q) => q.id === questionId);

    if (!isQuestionInQuestionnaire) {
      throw new BadRequestException('Question does not belong to this questionnaire');
    }

    // Check if answer already submitted for this question
    const existingSubmission = await this.submissionRepository.findOne({
      where: {
        attempt_id: attemptId,
        question_id: questionId,
      },
    });

    if (existingSubmission) {
      throw new BadRequestException('Answer already submitted for this question');
    }

    // Validate and score the answer
    const validationResult = await this.validateAnswer(question, userAnswer, hintsUsed);

    // Create submission
    const submission = this.submissionRepository.create({
      attempt_id: attemptId,
      question_id: questionId,
      userAnswer,
      validationStatus: validationResult.status,
      validationResult,
      timeSpent,
      hintsUsed,
      flaggedForReview: flaggedForReview || validationResult.status === ValidationStatus.Pending,
    });

    submission.validatedAt = new Date();
    const savedSubmission = await this.submissionRepository.save(submission);

    // Update question statistics
    await this.updateQuestionStatistics(questionId, validationResult);

    // Update attempt metadata (track path)
    if (attempt.metadata?.pathTaken) {
      attempt.metadata.pathTaken.push(questionId);
    } else {
      attempt.metadata = {
        ...attempt.metadata,
        pathTaken: [questionId],
      };
    }
    await this.attemptRepository.save(attempt);

    return plainToClass(AnswerSubmissionResponseDto, savedSubmission, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Complete a questionnaire attempt
   */
  async completeQuestionnaire(
    userId: number,
    attemptId: number,
    completeDto: CompleteQuestionnaireDto,
  ): Promise<AttemptResponseDto> {
    const { timeSpent, feedback, metadata } = completeDto;

    // Validate attempt
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId, user_id: userId },
      relations: ['questionnaire', 'submissions'],
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found or does not belong to you');
    }

    if (attempt.status !== AttemptStatus.InProgress) {
      throw new BadRequestException('Attempt is already completed or abandoned');
    }

    // Update metadata
    if (metadata) {
      attempt.metadata = {
        ...attempt.metadata,
        ...metadata,
      };
    }

    // Calculate final score
    const { score, percentage, maxScore } = await this.calculateAttemptScore(attemptId);

    // Determine pass/fail result
    let result = AttemptResult.Pending;
    if (attempt.questionnaire.passPercentage !== null && attempt.questionnaire.passPercentage !== undefined) {
      result = percentage >= attempt.questionnaire.passPercentage
        ? AttemptResult.Pass
        : AttemptResult.Fail;
    } else if (attempt.questionnaire.passPoints !== null && attempt.questionnaire.passPoints !== undefined) {
      result = score >= attempt.questionnaire.passPoints
        ? AttemptResult.Pass
        : AttemptResult.Fail;
    } else {
      result = AttemptResult.NoGrading;
    }

    // Update attempt
    attempt.status = AttemptStatus.Completed;
    attempt.result = result;
    attempt.score = score;
    attempt.percentage = percentage;
    attempt.timeSpent = timeSpent;
    attempt.feedback = feedback;
    attempt.completedAt = new Date();

    await this.attemptRepository.save(attempt);

    // Generate AI feedback asynchronously (don't wait for it)
    // This prevents slow AI responses from blocking the completion
    this.generateFeedback(attemptId).catch((error) => {
      console.error('Background AI feedback generation failed:', error);
    });

    return this.getAttempt(attemptId, userId);
  }

  /**
   * Get attempt details
   */
  async getAttempt(attemptId: number, userId: number): Promise<AttemptResponseDto> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId, user_id: userId },
      relations: ['user', 'questionnaire', 'submissions', 'submissions.question'],
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found or does not belong to you');
    }

    return plainToClass(AttemptResponseDto, attempt, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get user's attempts with filters and pagination
   */
  async getUserAttempts(
    userId: number,
    filters: QueryAttemptDto,
  ): Promise<PaginatedResponseDto<AttemptResponseDto>> {
    const result = await this.queryAttempts({ ...filters, userId });

    return {
      data: result.data.map((attempt) =>
        plainToClass(AttemptResponseDto, attempt, { excludeExtraneousValues: true }),
      ),
      meta: result.meta,
    };
  }

  /**
   * Get all attempts for a questionnaire (admin/educator)
   */
  async getQuestionnaireAttempts(
    questionnaireId: number,
    filters: QueryAttemptDto,
  ): Promise<PaginatedResponseDto<AttemptResponseDto>> {
    const result = await this.queryAttempts({ ...filters, questionnaireId });

    return {
      data: result.data.map((attempt) =>
        plainToClass(AttemptResponseDto, attempt, { excludeExtraneousValues: true }),
      ),
      meta: result.meta,
    };
  }

  /**
   * Query attempts with comprehensive filters
   */
  private async queryAttempts(
    queryDto: QueryAttemptDto,
  ): Promise<PaginatedResponseDto<QuestionnaireAttempt>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'startedAt',
      sortOrder = 'DESC',
      status,
      result,
      userId,
      questionnaireId,
      minScore,
      maxScore,
      minPercentage,
      maxPercentage,
      minTimeSpent,
      maxTimeSpent,
      startedAfter,
      startedBefore,
      completedAfter,
      completedBefore,
      hasAiFeedback,
      hasUserFeedback,
      submissionValidationStatus,
      hasFlaggedSubmissions,
      includeSubmissions,
      includeUser,
      includeQuestionnaire,
    } = queryDto;

    const queryBuilder = this.attemptRepository.createQueryBuilder('attempt');

    // Include relations based on flags
    if (includeUser) {
      queryBuilder.leftJoinAndSelect('attempt.user', 'user');
    }

    if (includeQuestionnaire) {
      queryBuilder.leftJoinAndSelect('attempt.questionnaire', 'questionnaire');
    }

    if (includeSubmissions) {
      queryBuilder.leftJoinAndSelect('attempt.submissions', 'submissions');
      queryBuilder.leftJoinAndSelect('submissions.question', 'question');
    }

    // Apply filters
    if (status) {
      queryBuilder.andWhere('attempt.status = :status', { status });
    }

    if (result) {
      queryBuilder.andWhere('attempt.result = :result', { result });
    }

    if (userId) {
      queryBuilder.andWhere('attempt.user_id = :userId', { userId });
    }

    if (questionnaireId) {
      queryBuilder.andWhere('attempt.questionnaire_id = :questionnaireId', { questionnaireId });
    }

    if (minScore !== undefined) {
      queryBuilder.andWhere('attempt.score >= :minScore', { minScore });
    }

    if (maxScore !== undefined) {
      queryBuilder.andWhere('attempt.score <= :maxScore', { maxScore });
    }

    if (minPercentage !== undefined) {
      queryBuilder.andWhere('attempt.percentage >= :minPercentage', { minPercentage });
    }

    if (maxPercentage !== undefined) {
      queryBuilder.andWhere('attempt.percentage <= :maxPercentage', { maxPercentage });
    }

    if (minTimeSpent !== undefined) {
      queryBuilder.andWhere('attempt.timeSpent >= :minTimeSpent', { minTimeSpent });
    }

    if (maxTimeSpent !== undefined) {
      queryBuilder.andWhere('attempt.timeSpent <= :maxTimeSpent', { maxTimeSpent });
    }

    if (startedAfter) {
      queryBuilder.andWhere('attempt.startedAt >= :startedAfter', { startedAfter });
    }

    if (startedBefore) {
      queryBuilder.andWhere('attempt.startedAt <= :startedBefore', { startedBefore });
    }

    if (completedAfter) {
      queryBuilder.andWhere('attempt.completedAt >= :completedAfter', { completedAfter });
    }

    if (completedBefore) {
      queryBuilder.andWhere('attempt.completedAt <= :completedBefore', { completedBefore });
    }

    if (hasAiFeedback !== undefined) {
      if (hasAiFeedback) {
        queryBuilder.andWhere('attempt.aiGeneratedFeedback IS NOT NULL');
      } else {
        queryBuilder.andWhere('attempt.aiGeneratedFeedback IS NULL');
      }
    }

    if (hasUserFeedback !== undefined) {
      if (hasUserFeedback) {
        queryBuilder.andWhere('attempt.feedback IS NOT NULL');
      } else {
        queryBuilder.andWhere('attempt.feedback IS NULL');
      }
    }

    // Filter by submission validation status
    if (submissionValidationStatus) {
      queryBuilder.innerJoin('attempt.submissions', 'sub');
      queryBuilder.andWhere('sub.validationStatus = :submissionValidationStatus', {
        submissionValidationStatus,
      });
    }

    // Filter by flagged submissions
    if (hasFlaggedSubmissions !== undefined) {
      queryBuilder.innerJoin('attempt.submissions', 'flaggedSub');
      queryBuilder.andWhere('flaggedSub.flaggedForReview = :hasFlaggedSubmissions', {
        hasFlaggedSubmissions,
      });
    }

    // Sorting
    const allowedSortFields = [
      'id',
      'status',
      'result',
      'score',
      'percentage',
      'timeSpent',
      'startedAt',
      'completedAt',
      'updatedAt',
    ];

    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`attempt.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('attempt.startedAt', sortOrder);
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, page, limit, total);
  }

  /**
   * Validate answer based on question checkType
   */
  async validateAnswer(
    question: Question,
    userAnswer: any,
    hintsUsed?: string[],
  ): Promise<ValidationResult> {
    let validationResult: ValidationResult = {
      status: ValidationStatus.Pending,
      score: 0,
      maxScore: question.points || 1,
    };

    switch (question.checkType) {
      case CheckType.Exact:
        validationResult = this.validateExact(question, userAnswer);
        break;

      case CheckType.Keywords:
        validationResult = this.validateKeywords(
          question,
          userAnswer,
          question.checkConfig as KeywordsCheckConfig,
        );
        break;

      case CheckType.AI:
        // AI validation will be implemented when AIService is available
        validationResult = await this.validateWithAI(
          question,
          userAnswer,
          question.checkConfig as AICheckConfig,
        );
        break;

      case CheckType.Manual:
        validationResult = {
          status: ValidationStatus.Pending,
          score: 0,
          maxScore: question.points || 1,
          explanation: 'This answer requires manual review by an educator.',
        };
        break;

      default:
        throw new BadRequestException(`Unsupported check type: ${question.checkType}`);
    }

    // Deduct points for hints used
    if (hintsUsed && hintsUsed.length > 0) {
      const hintCost = this.calculateHintCost(question, hintsUsed);
      validationResult.hintCostDeducted = hintCost;
      validationResult.hintsUsed = hintsUsed.length;
      validationResult.score = Math.max(0, validationResult.score - hintCost);
    }

    return validationResult;
  }

  /**
   * Exact answer validation
   */
  private validateExact(question: Question, userAnswer: any): ValidationResult {
    const correctAnswers = question.content.answers?.filter((a) => a.isCorrect) || [];

    if (correctAnswers.length === 0) {
      throw new BadRequestException('Question has no correct answers defined');
    }

    // Handle multiple choice (array of answer IDs)
    if (Array.isArray(userAnswer)) {
      const correctIds = correctAnswers.map((a) => a.id);
      const userIds = userAnswer;

      const allCorrect = correctIds.every((id) => userIds.includes(id));
      const noIncorrect = userIds.every((id) => correctIds.includes(id));

      if (allCorrect && noIncorrect) {
        return {
          status: ValidationStatus.Correct,
          score: question.points || 1,
          maxScore: question.points || 1,
          explanation: question.content.feedback?.correct || 'Correct!',
        };
      } else if (userIds.some((id) => correctIds.includes(id))) {
        const partialScore = (question.points || 1) * 0.5;
        return {
          status: ValidationStatus.Partial,
          score: partialScore,
          maxScore: question.points || 1,
          explanation: question.content.feedback?.partial || 'Partially correct',
        };
      } else {
        return {
          status: ValidationStatus.Incorrect,
          score: 0,
          maxScore: question.points || 1,
          explanation: question.content.feedback?.incorrect || 'Incorrect',
        };
      }
    }

    // Handle single answer (string comparison)
    const userAnswerStr = String(userAnswer).trim().toLowerCase();
    const isCorrect = correctAnswers.some(
      (a) => a.answerText.trim().toLowerCase() === userAnswerStr,
    );

    if (isCorrect) {
      return {
        status: ValidationStatus.Correct,
        score: question.points || 1,
        maxScore: question.points || 1,
        explanation: question.content.feedback?.correct || 'Correct!',
      };
    } else {
      return {
        status: ValidationStatus.Incorrect,
        score: 0,
        maxScore: question.points || 1,
        explanation: question.content.feedback?.incorrect || 'Incorrect',
      };
    }
  }

  /**
   * Keywords-based validation
   */
  private validateKeywords(
    question: Question,
    userAnswer: any,
    config: KeywordsCheckConfig,
  ): ValidationResult {
    if (!config || !config.keywords || config.keywords.length === 0) {
      throw new BadRequestException('Keywords configuration is missing or empty');
    }

    const userAnswerStr = String(userAnswer);
    const answerToCheck = config.caseSensitive ? userAnswerStr : userAnswerStr.toLowerCase();

    const matchedKeywords: string[] = [];

    for (const keyword of config.keywords) {
      const keywordToCheck = config.caseSensitive ? keyword : keyword.toLowerCase();

      if (config.partial) {
        if (answerToCheck.includes(keywordToCheck)) {
          matchedKeywords.push(keyword);
        }
      } else {
        const regex = new RegExp(`\\b${keywordToCheck}\\b`, config.caseSensitive ? '' : 'i');
        if (regex.test(userAnswerStr)) {
          matchedKeywords.push(keyword);
        }
      }
    }

    const minMatches = config.minMatches || config.keywords.length;
    const matchPercentage = matchedKeywords.length / config.keywords.length;

    if (matchedKeywords.length >= minMatches) {
      return {
        status: ValidationStatus.Correct,
        score: question.points || 1,
        maxScore: question.points || 1,
        explanation: question.content.feedback?.correct || 'All required keywords found!',
        keywordMatches: matchedKeywords,
      };
    } else if (matchedKeywords.length > 0) {
      const partialScore = (question.points || 1) * matchPercentage;
      return {
        status: ValidationStatus.Partial,
        score: partialScore,
        maxScore: question.points || 1,
        explanation:
          question.content.feedback?.partial ||
          `Partially correct. Found ${matchedKeywords.length} of ${config.keywords.length} keywords.`,
        keywordMatches: matchedKeywords,
      };
    } else {
      return {
        status: ValidationStatus.Incorrect,
        score: 0,
        maxScore: question.points || 1,
        explanation: question.content.feedback?.incorrect || 'No required keywords found',
        keywordMatches: [],
      };
    }
  }

  /**
   * AI-based validation
   */
  private async validateWithAI(
    question: Question,
    userAnswer: any,
    config: AICheckConfig,
  ): Promise<ValidationResult> {
    try {
      // Convert userAnswer to string for AI processing
      const userAnswerStr = typeof userAnswer === 'string'
        ? userAnswer
        : JSON.stringify(userAnswer);

      // Call AI service for validation
      const aiValidation = await this.aiService.validateAnswer(
        {
          text: question.content.text,
          content: question.content,
          correctAnswer: question.content.answers?.find((a) => a.isCorrect)?.answerText,
        },
        userAnswerStr,
        {
          type: config.type,
          sensitivity: config.sensitivity || 0.7,
          customPrompt: config.prompt,
        },
      );

      // Map AI validation result to our ValidationResult format
      const score = aiValidation.isValid
        ? (question.points || 1) * aiValidation.score
        : 0;

      let status = ValidationStatus.Incorrect;
      if (aiValidation.score >= 0.9) {
        status = ValidationStatus.Correct;
      } else if (aiValidation.score >= 0.5) {
        status = ValidationStatus.Partial;
      }

      return {
        status,
        score,
        maxScore: question.points || 1,
        explanation: aiValidation.feedback || 'AI validation completed',
        aiAnalysis: {
          confidence: aiValidation.confidence || 0,
          reasoning: aiValidation.reasoning || aiValidation.feedback || '',
          suggestions: aiValidation.suggestions || [],
        },
      };
    } catch (error) {
      // If AI validation fails, mark as pending for manual review
      return {
        status: ValidationStatus.Pending,
        score: 0,
        maxScore: question.points || 1,
        explanation: 'AI validation failed, manual review required',
        aiAnalysis: {
          confidence: 0,
          reasoning: `AI validation error: ${error.message}`,
        },
      };
    }
  }

  /**
   * Calculate hint cost
   */
  private calculateHintCost(question: Question, hintsUsed: string[]): number {
    if (!question.content.hints || question.content.hints.length === 0) {
      return 0;
    }

    let totalCost = 0;
    for (const hintId of hintsUsed) {
      const hint = question.content.hints.find((h) => h.id === hintId);
      if (hint) {
        totalCost += hint.cost || 0;
      }
    }

    return totalCost;
  }

  /**
   * Calculate attempt score
   */
  async calculateAttemptScore(attemptId: number): Promise<{
    score: number;
    percentage: number;
    maxScore: number;
  }> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
      relations: ['submissions', 'questionnaire'],
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    let totalScore = 0;
    let maxScore = 0;

    for (const submission of attempt.submissions) {
      if (submission.validationResult) {
        totalScore += submission.validationResult.score || 0;
        maxScore += submission.validationResult.maxScore || 0;
      }
    }

    // If questionnaire has explicit points, use that as max score
    const questionnaireMaxScore = await this.questionnaireService.calculateTotalPoints(
      attempt.questionnaire_id,
    );

    if (questionnaireMaxScore > 0) {
      maxScore = questionnaireMaxScore;
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return {
      score: totalScore,
      percentage,
      maxScore,
    };
  }

  /**
   * Generate AI feedback for attempt
   */
  async generateFeedback(attemptId: number): Promise<void> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
      relations: ['submissions', 'questionnaire', 'submissions.question'],
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    try {
      // Prepare submission data for AI
      const submissionsData = attempt.submissions.map((submission) => ({
        questionText: submission.question?.content?.text || 'Unknown question',
        userAnswer: submission.userAnswer,
        isCorrect: submission.validationStatus === ValidationStatus.Correct,
        score: submission.validationResult?.score || 0,
        maxScore: submission.validationResult?.maxScore || 1,
        timeSpent: submission.timeSpent,
      }));

      // Prepare attempt data
      const attemptData = {
        score: attempt.score || 0,
        totalPoints: await this.questionnaireService.calculateTotalPoints(attempt.questionnaire_id),
        timeSpent: attempt.timeSpent,
        status: attempt.status,
        result: attempt.result,
      };

      // Generate feedback using AI service
      const feedbackResult = await this.aiService.generateFeedback(
        attemptData,
        submissionsData,
      );

      // Format feedback as a readable string
      const formattedFeedback = this.formatAIFeedback(feedbackResult);

      // Save AI feedback
      attempt.aiGeneratedFeedback = formattedFeedback;
      await this.attemptRepository.save(attempt);
    } catch (error) {
      // If AI feedback generation fails, log but don't throw
      // We don't want to fail the entire completion just because feedback failed
      console.error('Failed to generate AI feedback:', error);
      attempt.aiGeneratedFeedback = 'Feedback generation is currently unavailable';
      await this.attemptRepository.save(attempt);
    }
  }

  /**
   * Format AI feedback result into a readable string
   */
  private formatAIFeedback(feedbackResult: any): string {
    const sections = [];

    if (feedbackResult.overallFeedback) {
      sections.push(`## Overall Feedback\n${feedbackResult.overallFeedback}`);
    }

    if (feedbackResult.strengths && feedbackResult.strengths.length > 0) {
      sections.push(`## Strengths\n${feedbackResult.strengths.map((s: string) => `- ${s}`).join('\n')}`);
    }

    if (feedbackResult.areasForImprovement && feedbackResult.areasForImprovement.length > 0) {
      sections.push(`## Areas for Improvement\n${feedbackResult.areasForImprovement.map((a: string) => `- ${a}`).join('\n')}`);
    }

    if (feedbackResult.recommendations && feedbackResult.recommendations.length > 0) {
      sections.push(`## Recommendations\n${feedbackResult.recommendations.map((r: string) => `- ${r}`).join('\n')}`);
    }

    if (feedbackResult.progressAnalysis) {
      sections.push(`## Progress Analysis\n${feedbackResult.progressAnalysis}`);
    }

    if (feedbackResult.nextSteps && feedbackResult.nextSteps.length > 0) {
      sections.push(`## Next Steps\n${feedbackResult.nextSteps.map((n: string) => `- ${n}`).join('\n')}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Update question statistics after submission
   */
  private async updateQuestionStatistics(
    questionId: number,
    validationResult: ValidationResult,
  ): Promise<void> {
    const question = await this.questionService.findOne(questionId);

    const newTotalAttempts = question.totalAttempts + 1;
    const newCorrectAttempts =
      question.correctAttempts +
      (validationResult.status === ValidationStatus.Correct ? 1 : 0);

    // Calculate new average score
    const currentTotalScore = (question.averageScore || 0) * question.totalAttempts;
    const newTotalScore = currentTotalScore + validationResult.score;
    const newAverageScore = newTotalScore / newTotalAttempts;

    await this.questionService.updateStatistics(questionId, {
      totalAttempts: newTotalAttempts,
      correctAttempts: newCorrectAttempts,
      averageScore: newAverageScore,
    });
  }

  /**
   * Manual review of a submission (educator/admin)
   */
  async manualReview(
    submissionId: number,
    validationResult: ValidationResult,
    reviewNotes?: string,
  ): Promise<AnswerSubmissionResponseDto> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ['attempt', 'question'],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    submission.validationStatus = validationResult.status;
    submission.validationResult = validationResult;
    submission.reviewNotes = reviewNotes;
    submission.validatedAt = new Date();
    submission.flaggedForReview = false;

    const updated = await this.submissionRepository.save(submission);

    // Recalculate attempt score
    if (submission.attempt.status === AttemptStatus.Completed) {
      const { score, percentage } = await this.calculateAttemptScore(submission.attempt_id);
      submission.attempt.score = score;
      submission.attempt.percentage = percentage;

      // Recalculate result
      if (submission.attempt.questionnaire) {
        const questionnaire = await this.questionnaireService.findOne(
          submission.attempt.questionnaire_id,
        );

        let result = AttemptResult.Pending;
        if (questionnaire.passPercentage !== null && questionnaire.passPercentage !== undefined) {
          result = percentage >= questionnaire.passPercentage
            ? AttemptResult.Pass
            : AttemptResult.Fail;
        } else if (questionnaire.passPoints !== null && questionnaire.passPoints !== undefined) {
          result = score >= questionnaire.passPoints
            ? AttemptResult.Pass
            : AttemptResult.Fail;
        }

        submission.attempt.result = result;
      }

      await this.attemptRepository.save(submission.attempt);
    }

    return plainToClass(AnswerSubmissionResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }
}
