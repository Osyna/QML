import { Injectable } from '@nestjs/common';
import { Question, CheckConfig } from '../question/entities/question.entity';
import { CheckMethod, AICheckType } from '../common/enums/check-type.enum';
import { ValidationResult } from './entities/answer.entity';

@Injectable()
export class AnswerValidationService {
  /**
   * Validates a user answer based on the question's check configuration
   */
  async validateAnswer(
    question: Question,
    userAnswer: string,
    usedHints?: number[],
  ): Promise<ValidationResult> {
    const maxScore = question.points || 1;
    let score = 0;
    let isCorrect = false;
    let feedback = '';

    // Calculate hint cost
    const hintCost = this.calculateHintCost(question, usedHints);

    // If question has no check method or no answers, it's a survey question
    if (!question.check || !question.content.answers || question.content.answers.length === 0) {
      return {
        isCorrect: true,
        score: maxScore - hintCost,
        maxScore,
        percentage: 100,
        feedback: 'Answer recorded',
        usedHints,
        hintCost,
      };
    }

    // Validate based on check method
    switch (question.check.method) {
      case CheckMethod.Exact:
        ({ isCorrect, score, feedback } = this.exactCheck(question, userAnswer));
        break;

      case CheckMethod.Keywords:
        ({ isCorrect, score, feedback } = this.keywordsCheck(question, userAnswer));
        break;

      case CheckMethod.AI:
        ({ isCorrect, score, feedback } = await this.aiCheck(question, userAnswer));
        break;

      case CheckMethod.Manual:
        ({ isCorrect, score, feedback } = this.manualCheck(question));
        break;

      default:
        ({ isCorrect, score, feedback } = this.exactCheck(question, userAnswer));
    }

    // Subtract hint cost from score
    const finalScore = Math.max(0, score - hintCost);
    const percentage = (finalScore / maxScore) * 100;

    return {
      isCorrect,
      score: finalScore,
      maxScore,
      percentage,
      feedback: isCorrect
        ? question.content.feedback?.correct || feedback
        : question.content.feedback?.incorrect || feedback,
      usedHints,
      hintCost,
    };
  }

  /**
   * Exact check - answer must match exactly
   */
  private exactCheck(
    question: Question,
    userAnswer: string,
  ): { isCorrect: boolean; score: number; feedback: string } {
    const correctAnswers = question.content.answers || [];
    const maxScore = question.points || 1;

    const isCorrect = correctAnswers.some(
      (ans) => ans.answerText.trim().toLowerCase() === userAnswer.trim().toLowerCase(),
    );

    return {
      isCorrect,
      score: isCorrect ? maxScore : 0,
      feedback: isCorrect ? 'Correct answer!' : 'Incorrect answer',
    };
  }

  /**
   * Keywords check - answer must contain specific keywords
   */
  private keywordsCheck(
    question: Question,
    userAnswer: string,
  ): { isCorrect: boolean; score: number; feedback: string } {
    const keywords = question.check?.keywords || [];
    const maxScore = question.points || 1;
    const userAnswerLower = userAnswer.toLowerCase();

    let matchedKeywords = 0;
    keywords.forEach((keyword) => {
      if (userAnswerLower.includes(keyword.toLowerCase())) {
        matchedKeywords++;
      }
    });

    const percentage = keywords.length > 0 ? matchedKeywords / keywords.length : 0;
    const score = maxScore * percentage;
    const isCorrect = percentage >= 0.5; // At least 50% of keywords matched

    return {
      isCorrect,
      score,
      feedback: `Matched ${matchedKeywords} out of ${keywords.length} keywords`,
    };
  }

  /**
   * AI check - uses AI to validate the answer based on meaning or custom prompt
   */
  private async aiCheck(
    question: Question,
    userAnswer: string,
  ): Promise<{ isCorrect: boolean; score: number; feedback: string }> {
    const maxScore = question.points || 1;
    const checkConfig = question.check;
    const correctAnswers = question.content.answers || [];

    if (correctAnswers.length === 0) {
      return {
        isCorrect: true,
        score: maxScore,
        feedback: 'No reference answer to compare',
      };
    }

    const referenceAnswer = correctAnswers[0].answerText;

    // For now, this is a placeholder for AI integration
    // In production, you would integrate with an AI service like OpenAI
    // Example implementation:
    if (checkConfig?.checkType === AICheckType.Meaning) {
      const sensitivity = checkConfig.sensitivity ?? 0.5;
      // Placeholder: Calculate similarity score (0-1)
      const similarity = this.calculateSimilarity(userAnswer, referenceAnswer);
      const adjustedScore = this.applySensitivity(similarity, sensitivity);
      const score = maxScore * adjustedScore;
      const isCorrect = adjustedScore >= 0.5;

      return {
        isCorrect,
        score,
        feedback: `Answer similarity: ${(adjustedScore * 100).toFixed(1)}%`,
      };
    } else if (checkConfig?.checkType === AICheckType.Custom) {
      // Custom prompt evaluation
      // In production, send the prompt and answer to AI service
      return {
        isCorrect: true,
        score: maxScore * 0.8,
        feedback: 'Custom AI evaluation (placeholder)',
      };
    }

    // Default to meaning check
    const similarity = this.calculateSimilarity(userAnswer, referenceAnswer);
    const score = maxScore * similarity;
    const isCorrect = similarity >= 0.5;

    return {
      isCorrect,
      score,
      feedback: `Answer similarity: ${(similarity * 100).toFixed(1)}%`,
    };
  }

  /**
   * Manual check - requires human review
   */
  private manualCheck(
    question: Question,
  ): { isCorrect: boolean; score: number; feedback: string } {
    return {
      isCorrect: false,
      score: 0,
      feedback: 'This answer requires manual review',
    };
  }

  /**
   * Calculate hint cost
   */
  private calculateHintCost(question: Question, usedHints?: number[]): number {
    if (!usedHints || usedHints.length === 0) {
      return 0;
    }

    const hints = question.content.hints || [];
    let totalCost = 0;

    usedHints.forEach((hintIndex) => {
      if (hints[hintIndex]) {
        totalCost += hints[hintIndex].cost || 0;
      }
    });

    return totalCost;
  }

  /**
   * Calculate similarity between two strings (placeholder)
   * In production, you would use a more sophisticated algorithm or AI
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const t1 = text1.toLowerCase().trim();
    const t2 = text2.toLowerCase().trim();

    if (t1 === t2) return 1.0;

    // Simple word overlap calculation
    const words1 = new Set(t1.split(/\s+/));
    const words2 = new Set(t2.split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Apply sensitivity to similarity score
   */
  private applySensitivity(similarity: number, sensitivity: number): number {
    // sensitivity = 1 means exact match required
    // sensitivity = 0 means all answers accepted
    if (sensitivity === 0) return 1.0;
    if (sensitivity === 1) return similarity === 1 ? 1.0 : 0.0;

    // Scale the similarity based on sensitivity
    // Higher sensitivity = stricter requirements
    return Math.pow(similarity, sensitivity);
  }
}
