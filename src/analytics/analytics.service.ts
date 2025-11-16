import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { QuestionnaireAttempt, AttemptStatus } from '../answer/entities/questionnaire-attempt.entity';
import { AnswerSubmission, ValidationStatus } from '../answer/entities/answer-submission.entity';
import { Question } from '../question/entities/question.entity';
import { Questionnaire } from '../questionnaire/entities/questionnaire.entity';

export interface QuestionStatistics {
  questionId: number;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  partialAttempts: number;
  successRate: number;
  averageScore: number;
  averageTimeSpent: number;
  medianTimeSpent: number;
  standardDeviation: number;
  discriminationIndex: number;
  difficultyIndex: number;
}

export interface QuestionnaireStatistics {
  questionnaireId: number;
  totalAttempts: number;
  completedAttempts: number;
  inProgressAttempts: number;
  abandonedAttempts: number;
  averageScore: number;
  averagePercentage: number;
  averageCompletionTime: number;
  medianScore: number;
  passRate: number;
  completionRate: number;
  questionsStatistics: QuestionStatistics[];
}

export interface UserStatistics {
  userId: number;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  averagePercentage: number;
  totalTimeSpent: number;
  averageTimePerAttempt: number;
  passRate: number;
  strongCategories: string[];
  weakCategories: string[];
  recentPerformance: {
    date: Date;
    score: number;
    percentage: number;
    questionnaireName: string;
  }[];
}

export interface DifficultyAnalysis {
  questionId: number;
  difficultyIndex: number; // 0-1, higher = harder
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'very-hard';
  totalAttempts: number;
  successRate: number;
  averageTimeSpent: number;
  recommendation: string;
}

export interface DiscriminationAnalysis {
  questionId: number;
  discriminationIndex: number; // -1 to 1
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'problematic';
  upperGroupSuccess: number;
  lowerGroupSuccess: number;
  totalAttempts: number;
  recommendation: string;
}

export interface TimeAnalysis {
  questionnaireId: number;
  easyQuestions: {
    averageTime: number;
    medianTime: number;
    count: number;
  };
  mediumQuestions: {
    averageTime: number;
    medianTime: number;
    count: number;
  };
  hardQuestions: {
    averageTime: number;
    medianTime: number;
    count: number;
  };
}

export interface CompletionRateAnalysis {
  questionnaireId: number;
  totalAttempts: number;
  completedAttempts: number;
  completionRate: number;
  averageCompletionTime: number;
  medianCompletionTime: number;
  dropOffPoints: {
    questionIndex: number;
    questionId: number;
    dropOffCount: number;
  }[];
}

export interface PerformanceTrend {
  questionId: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  dataPoints: {
    date: string;
    attempts: number;
    successRate: number;
    averageScore: number;
    averageTime: number;
  }[];
  trend: 'improving' | 'declining' | 'stable';
  trendSlope: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(QuestionnaireAttempt)
    private readonly attemptRepository: Repository<QuestionnaireAttempt>,
    @InjectRepository(AnswerSubmission)
    private readonly submissionRepository: Repository<AnswerSubmission>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Questionnaire)
    private readonly questionnaireRepository: Repository<Questionnaire>,
  ) {}

  /**
   * Get detailed statistics for a specific question
   */
  async getQuestionStatistics(questionId: number): Promise<QuestionStatistics> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    const submissions = await this.submissionRepository.find({
      where: { question_id: questionId },
      relations: ['attempt'],
    });

    if (submissions.length === 0) {
      return {
        questionId,
        totalAttempts: 0,
        correctAttempts: 0,
        incorrectAttempts: 0,
        partialAttempts: 0,
        successRate: 0,
        averageScore: 0,
        averageTimeSpent: 0,
        medianTimeSpent: 0,
        standardDeviation: 0,
        discriminationIndex: 0,
        difficultyIndex: 0,
      };
    }

    const correctAttempts = submissions.filter(
      (s) => s.validationStatus === ValidationStatus.Correct,
    ).length;
    const incorrectAttempts = submissions.filter(
      (s) => s.validationStatus === ValidationStatus.Incorrect,
    ).length;
    const partialAttempts = submissions.filter(
      (s) => s.validationStatus === ValidationStatus.Partial,
    ).length;

    const scores = submissions
      .map((s) => s.validationResult?.score || 0)
      .filter((score) => score !== null);

    const times = submissions
      .map((s) => s.timeSpent)
      .filter((time) => time !== null && time > 0);

    const averageScore = this.calculateMean(scores);
    const averageTimeSpent = this.calculateMean(times);
    const medianTimeSpent = this.calculateMedian(times);
    const standardDeviation = this.calculateStandardDeviation(scores);
    const discriminationIndex = await this.calculateDiscriminationIndex(questionId);
    const difficultyIndex = 1 - correctAttempts / submissions.length;

    return {
      questionId,
      totalAttempts: submissions.length,
      correctAttempts,
      incorrectAttempts,
      partialAttempts,
      successRate: (correctAttempts / submissions.length) * 100,
      averageScore,
      averageTimeSpent,
      medianTimeSpent,
      standardDeviation,
      discriminationIndex,
      difficultyIndex,
    };
  }

  /**
   * Get statistics for a questionnaire including all questions
   */
  async getQuestionnaireStatistics(
    questionnaireId: number,
  ): Promise<QuestionnaireStatistics> {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: questionnaireId },
      relations: ['questions'],
    });

    if (!questionnaire) {
      throw new NotFoundException(
        `Questionnaire with ID ${questionnaireId} not found`,
      );
    }

    const attempts = await this.attemptRepository.find({
      where: { questionnaire_id: questionnaireId },
    });

    if (attempts.length === 0) {
      return {
        questionnaireId,
        totalAttempts: 0,
        completedAttempts: 0,
        inProgressAttempts: 0,
        abandonedAttempts: 0,
        averageScore: 0,
        averagePercentage: 0,
        averageCompletionTime: 0,
        medianScore: 0,
        passRate: 0,
        completionRate: 0,
        questionsStatistics: [],
      };
    }

    const completedAttempts = attempts.filter(
      (a) => a.status === AttemptStatus.Completed,
    );
    const inProgressAttempts = attempts.filter(
      (a) => a.status === AttemptStatus.InProgress,
    ).length;
    const abandonedAttempts = attempts.filter(
      (a) => a.status === AttemptStatus.Abandoned || a.status === AttemptStatus.TimedOut,
    ).length;

    const scores = completedAttempts
      .map((a) => a.score)
      .filter((score) => score !== null);
    const percentages = completedAttempts
      .map((a) => a.percentage)
      .filter((p) => p !== null);
    const times = completedAttempts
      .map((a) => a.timeSpent)
      .filter((time) => time !== null && time > 0);

    const passedAttempts = completedAttempts.filter((a) => {
      if (questionnaire.passPercentage) {
        return a.percentage >= questionnaire.passPercentage;
      }
      if (questionnaire.passPoints) {
        return a.score >= questionnaire.passPoints;
      }
      return false;
    }).length;

    // Get statistics for each question
    const questionsStatistics = await Promise.all(
      questionnaire.questions.map((q) => this.getQuestionStatistics(q.id)),
    );

    return {
      questionnaireId,
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      inProgressAttempts,
      abandonedAttempts,
      averageScore: this.calculateMean(scores),
      averagePercentage: this.calculateMean(percentages),
      averageCompletionTime: this.calculateMean(times),
      medianScore: this.calculateMedian(scores),
      passRate: completedAttempts.length > 0
        ? (passedAttempts / completedAttempts.length) * 100
        : 0,
      completionRate: (completedAttempts.length / attempts.length) * 100,
      questionsStatistics,
    };
  }

  /**
   * Get performance statistics for a specific user
   */
  async getUserStatistics(userId: number): Promise<UserStatistics> {
    const attempts = await this.attemptRepository.find({
      where: { user_id: userId },
      relations: ['questionnaire'],
      order: { startedAt: 'DESC' },
    });

    if (attempts.length === 0) {
      return {
        userId,
        totalAttempts: 0,
        completedAttempts: 0,
        averageScore: 0,
        averagePercentage: 0,
        totalTimeSpent: 0,
        averageTimePerAttempt: 0,
        passRate: 0,
        strongCategories: [],
        weakCategories: [],
        recentPerformance: [],
      };
    }

    const completedAttempts = attempts.filter(
      (a) => a.status === AttemptStatus.Completed,
    );

    const scores = completedAttempts
      .map((a) => a.score)
      .filter((score) => score !== null);
    const percentages = completedAttempts
      .map((a) => a.percentage)
      .filter((p) => p !== null);
    const times = completedAttempts
      .map((a) => a.timeSpent)
      .filter((time) => time !== null && time > 0);

    const totalTimeSpent = times.reduce((sum, time) => sum + time, 0);

    // Calculate pass rate
    const passedAttempts = completedAttempts.filter((a) => {
      const questionnaire = a.questionnaire;
      if (questionnaire?.passPercentage) {
        return a.percentage >= questionnaire.passPercentage;
      }
      if (questionnaire?.passPoints) {
        return a.score >= questionnaire.passPoints;
      }
      return false;
    }).length;

    // Analyze performance by category
    const categoryPerformance = new Map<string, { total: number; passed: number }>();
    for (const attempt of completedAttempts) {
      const category = attempt.questionnaire?.category || 'uncategorized';
      const existing = categoryPerformance.get(category) || { total: 0, passed: 0 };
      existing.total++;

      const questionnaire = attempt.questionnaire;
      if (questionnaire?.passPercentage && attempt.percentage >= questionnaire.passPercentage) {
        existing.passed++;
      } else if (questionnaire?.passPoints && attempt.score >= questionnaire.passPoints) {
        existing.passed++;
      }

      categoryPerformance.set(category, existing);
    }

    const categoriesWithRates = Array.from(categoryPerformance.entries())
      .map(([category, stats]) => ({
        category,
        rate: stats.passed / stats.total,
      }))
      .sort((a, b) => b.rate - a.rate);

    const strongCategories = categoriesWithRates
      .filter((c) => c.rate >= 0.7)
      .map((c) => c.category)
      .slice(0, 5);

    const weakCategories = categoriesWithRates
      .filter((c) => c.rate < 0.5)
      .map((c) => c.category)
      .slice(0, 5);

    // Recent performance (last 10 attempts)
    const recentPerformance = completedAttempts.slice(0, 10).map((a) => ({
      date: a.completedAt || a.startedAt,
      score: a.score || 0,
      percentage: a.percentage || 0,
      questionnaireName: a.questionnaire?.name || 'Unknown',
    }));

    return {
      userId,
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      averageScore: this.calculateMean(scores),
      averagePercentage: this.calculateMean(percentages),
      totalTimeSpent,
      averageTimePerAttempt: this.calculateMean(times),
      passRate: completedAttempts.length > 0
        ? (passedAttempts / completedAttempts.length) * 100
        : 0,
      strongCategories,
      weakCategories,
      recentPerformance,
    };
  }

  /**
   * Analyze question difficulty based on actual performance
   */
  async getQuestionDifficultyAnalysis(
    questionId: number,
  ): Promise<DifficultyAnalysis> {
    const stats = await this.getQuestionStatistics(questionId);

    const difficultyIndex = stats.difficultyIndex;
    let difficultyLevel: 'easy' | 'medium' | 'hard' | 'very-hard';
    let recommendation: string;

    if (difficultyIndex < 0.25) {
      difficultyLevel = 'easy';
      recommendation = 'Question is very easy. Consider making it more challenging or using it for introductory assessments.';
    } else if (difficultyIndex < 0.5) {
      difficultyLevel = 'medium';
      recommendation = 'Question has appropriate difficulty level for general assessments.';
    } else if (difficultyIndex < 0.75) {
      difficultyLevel = 'hard';
      recommendation = 'Question is challenging. Good for advanced assessments or high-stakes testing.';
    } else {
      difficultyLevel = 'very-hard';
      recommendation = 'Question is very difficult. Review question clarity and fairness, or use for expert-level assessments only.';
    }

    return {
      questionId,
      difficultyIndex,
      difficultyLevel,
      totalAttempts: stats.totalAttempts,
      successRate: stats.successRate,
      averageTimeSpent: stats.averageTimeSpent,
      recommendation,
    };
  }

  /**
   * Calculate discrimination index - how well question separates high/low performers
   * Returns value between -1 and 1, higher is better (0.3+ is good)
   */
  async getDiscriminationIndex(questionId: number): Promise<DiscriminationAnalysis> {
    const discriminationIndex = await this.calculateDiscriminationIndex(questionId);
    const stats = await this.getQuestionStatistics(questionId);

    // Get upper and lower group performance
    const submissions = await this.submissionRepository.find({
      where: { question_id: questionId },
      relations: ['attempt'],
    });

    // Sort by overall attempt score
    const sortedSubmissions = submissions
      .filter((s) => s.attempt?.score !== null)
      .sort((a, b) => (b.attempt?.score || 0) - (a.attempt?.score || 0));

    const groupSize = Math.floor(sortedSubmissions.length * 0.27); // Top/bottom 27%
    const upperGroup = sortedSubmissions.slice(0, groupSize);
    const lowerGroup = sortedSubmissions.slice(-groupSize);

    const upperGroupSuccess =
      upperGroup.filter((s) => s.validationStatus === ValidationStatus.Correct).length /
      upperGroup.length;
    const lowerGroupSuccess =
      lowerGroup.filter((s) => s.validationStatus === ValidationStatus.Correct).length /
      lowerGroup.length;

    let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'problematic';
    let recommendation: string;

    if (discriminationIndex >= 0.4) {
      quality = 'excellent';
      recommendation = 'Question effectively discriminates between high and low performers. Excellent for assessments.';
    } else if (discriminationIndex >= 0.3) {
      quality = 'good';
      recommendation = 'Question shows good discrimination. Suitable for most assessments.';
    } else if (discriminationIndex >= 0.2) {
      quality = 'fair';
      recommendation = 'Question shows fair discrimination. Consider minor revisions to improve.';
    } else if (discriminationIndex >= 0) {
      quality = 'poor';
      recommendation = 'Question shows poor discrimination. Review and revise the question.';
    } else {
      quality = 'problematic';
      recommendation = 'Negative discrimination - low performers do better than high performers. Question needs major revision or removal.';
    }

    return {
      questionId,
      discriminationIndex,
      quality,
      upperGroupSuccess: upperGroupSuccess * 100,
      lowerGroupSuccess: lowerGroupSuccess * 100,
      totalAttempts: stats.totalAttempts,
      recommendation,
    };
  }

  /**
   * Analyze average time spent by difficulty level
   */
  async getAverageTimeByDifficulty(
    questionnaireId: number,
  ): Promise<TimeAnalysis> {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: questionnaireId },
      relations: ['questions'],
    });

    if (!questionnaire) {
      throw new NotFoundException(
        `Questionnaire with ID ${questionnaireId} not found`,
      );
    }

    const timeByDifficulty = {
      easy: [] as number[],
      medium: [] as number[],
      hard: [] as number[],
    };

    for (const question of questionnaire.questions) {
      const submissions = await this.submissionRepository.find({
        where: { question_id: question.id },
      });

      const times = submissions
        .map((s) => s.timeSpent)
        .filter((time) => time !== null && time > 0);

      if (times.length > 0) {
        const difficulty = question.difficulty?.toLowerCase();
        if (difficulty === 'easy') {
          timeByDifficulty.easy.push(...times);
        } else if (difficulty === 'hard' || difficulty === 'very-hard') {
          timeByDifficulty.hard.push(...times);
        } else {
          timeByDifficulty.medium.push(...times);
        }
      }
    }

    return {
      questionnaireId,
      easyQuestions: {
        averageTime: this.calculateMean(timeByDifficulty.easy),
        medianTime: this.calculateMedian(timeByDifficulty.easy),
        count: timeByDifficulty.easy.length,
      },
      mediumQuestions: {
        averageTime: this.calculateMean(timeByDifficulty.medium),
        medianTime: this.calculateMedian(timeByDifficulty.medium),
        count: timeByDifficulty.medium.length,
      },
      hardQuestions: {
        averageTime: this.calculateMean(timeByDifficulty.hard),
        medianTime: this.calculateMedian(timeByDifficulty.hard),
        count: timeByDifficulty.hard.length,
      },
    };
  }

  /**
   * Get completion rate and identify drop-off points
   */
  async getCompletionRate(
    questionnaireId: number,
  ): Promise<CompletionRateAnalysis> {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: questionnaireId },
      relations: ['questions'],
    });

    if (!questionnaire) {
      throw new NotFoundException(
        `Questionnaire with ID ${questionnaireId} not found`,
      );
    }

    const attempts = await this.attemptRepository.find({
      where: { questionnaire_id: questionnaireId },
      relations: ['submissions'],
    });

    const completedAttempts = attempts.filter(
      (a) => a.status === AttemptStatus.Completed,
    );

    const completionTimes = completedAttempts
      .map((a) => a.timeSpent)
      .filter((time) => time !== null && time > 0);

    // Identify drop-off points
    const dropOffPoints: {
      questionIndex: number;
      questionId: number;
      dropOffCount: number;
    }[] = [];

    const abandonedAttempts = attempts.filter(
      (a) => a.status === AttemptStatus.Abandoned || a.status === AttemptStatus.TimedOut,
    );

    // Count how many attempts stopped at each question
    const questionDropOffs = new Map<number, number>();
    for (const attempt of abandonedAttempts) {
      const lastQuestionIndex = attempt.metadata?.currentQuestionIndex || 0;
      if (lastQuestionIndex < questionnaire.questions.length) {
        const questionId = questionnaire.questions[lastQuestionIndex]?.id;
        if (questionId) {
          questionDropOffs.set(
            questionId,
            (questionDropOffs.get(questionId) || 0) + 1,
          );
        }
      }
    }

    // Convert to array and sort by drop-off count
    for (const [questionId, count] of questionDropOffs.entries()) {
      const questionIndex = questionnaire.questions.findIndex((q) => q.id === questionId);
      if (questionIndex !== -1) {
        dropOffPoints.push({
          questionIndex,
          questionId,
          dropOffCount: count,
        });
      }
    }

    dropOffPoints.sort((a, b) => b.dropOffCount - a.dropOffCount);

    return {
      questionnaireId,
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      completionRate: (completedAttempts.length / attempts.length) * 100,
      averageCompletionTime: this.calculateMean(completionTimes),
      medianCompletionTime: this.calculateMedian(completionTimes),
      dropOffPoints: dropOffPoints.slice(0, 5), // Top 5 drop-off points
    };
  }

  /**
   * Get performance trends over time for a question
   */
  async getQuestionPerformanceTrends(
    questionId: number,
    dateRange: { start: Date; end: Date },
  ): Promise<PerformanceTrend> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    const submissions = await this.submissionRepository.find({
      where: {
        question_id: questionId,
        submittedAt: Between(dateRange.start, dateRange.end),
      },
    });

    // Group submissions by date
    const submissionsByDate = new Map<string, AnswerSubmission[]>();
    for (const submission of submissions) {
      const dateKey = submission.submittedAt.toISOString().split('T')[0];
      const existing = submissionsByDate.get(dateKey) || [];
      existing.push(submission);
      submissionsByDate.set(dateKey, existing);
    }

    // Calculate metrics for each date
    const dataPoints = Array.from(submissionsByDate.entries())
      .map(([date, subs]) => {
        const correctCount = subs.filter(
          (s) => s.validationStatus === ValidationStatus.Correct,
        ).length;
        const scores = subs
          .map((s) => s.validationResult?.score || 0)
          .filter((score) => score !== null);
        const times = subs
          .map((s) => s.timeSpent)
          .filter((time) => time !== null && time > 0);

        return {
          date,
          attempts: subs.length,
          successRate: (correctCount / subs.length) * 100,
          averageScore: this.calculateMean(scores),
          averageTime: this.calculateMean(times),
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    let trendSlope = 0;

    if (dataPoints.length >= 2) {
      // Simple linear regression on success rates
      const n = dataPoints.length;
      const xValues = dataPoints.map((_, i) => i);
      const yValues = dataPoints.map((d) => d.successRate);

      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

      trendSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

      if (trendSlope > 0.5) {
        trend = 'improving';
      } else if (trendSlope < -0.5) {
        trend = 'declining';
      }
    }

    return {
      questionId,
      dateRange,
      dataPoints,
      trend,
      trendSlope,
    };
  }

  // ============ Private Helper Methods ============

  /**
   * Calculate mean (average) of an array of numbers
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Calculate median of an array of numbers
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const avgSquaredDiff = this.calculateMean(squaredDiffs);
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Calculate discrimination index for a question
   * Uses the top and bottom 27% of test takers
   */
  private async calculateDiscriminationIndex(
    questionId: number,
  ): Promise<number> {
    const submissions = await this.submissionRepository.find({
      where: { question_id: questionId },
      relations: ['attempt'],
    });

    if (submissions.length < 10) {
      return 0; // Not enough data
    }

    // Sort submissions by overall attempt score
    const sortedSubmissions = submissions
      .filter((s) => s.attempt?.score !== null)
      .sort((a, b) => (b.attempt?.score || 0) - (a.attempt?.score || 0));

    // Take top and bottom 27%
    const groupSize = Math.floor(sortedSubmissions.length * 0.27);
    const upperGroup = sortedSubmissions.slice(0, groupSize);
    const lowerGroup = sortedSubmissions.slice(-groupSize);

    if (upperGroup.length === 0 || lowerGroup.length === 0) {
      return 0;
    }

    // Calculate proportion correct for each group
    const upperCorrect =
      upperGroup.filter((s) => s.validationStatus === ValidationStatus.Correct).length /
      upperGroup.length;
    const lowerCorrect =
      lowerGroup.filter((s) => s.validationStatus === ValidationStatus.Correct).length /
      lowerGroup.length;

    // Discrimination index is the difference
    return upperCorrect - lowerCorrect;
  }
}
