/**
 * AI Service Usage Examples
 *
 * This file demonstrates how to use the AIService in your application.
 * These are example implementations - adapt them to your specific needs.
 */

import { Injectable } from '@nestjs/common';
import { AIService } from '../ai.service';
import { Difficulty } from '../../common/enums/difficulty.enum';
import { AICheckType } from '../../common/enums/check-type.enum';

@Injectable()
export class AIServiceExamples {
  constructor(private readonly aiService: AIService) {}

  /**
   * Example 1: Simple meaning-based validation
   */
  async example1_MeaningValidation() {
    const question = {
      text: 'What is photosynthesis?',
      correctAnswer: 'Photosynthesis is the process by which plants use sunlight to convert carbon dioxide and water into glucose and oxygen.',
    };

    const userAnswer = 'Plants use sunlight to make food from CO2 and water, producing oxygen as a byproduct.';

    // Validate with default sensitivity (0.7)
    const result = await this.aiService.validateMeaningMatch(question, userAnswer);

    console.log('Validation Result:', {
      isValid: result.isValid,
      score: result.score,
      confidence: result.confidence,
      feedback: result.feedback,
    });

    return result;
  }

  /**
   * Example 2: Keyword-based validation
   */
  async example2_KeywordValidation() {
    const userAnswer = 'Mitochondria is the powerhouse of the cell that produces ATP through cellular respiration.';

    const result = await this.aiService.validateKeywords(userAnswer, {
      required: ['mitochondria', 'ATP'],
      optional: ['cellular respiration', 'powerhouse', 'energy'],
      forbidden: ['nucleus', 'chloroplast'],
      minMatches: 2,
      caseSensitive: false,
    });

    console.log('Keyword Validation:', {
      isValid: result.isValid,
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
    });

    return result;
  }

  /**
   * Example 3: Custom prompt validation
   */
  async example3_CustomValidation() {
    const userAnswer = 'E = mc² shows that energy and mass are equivalent and convertible.';

    const customPrompt = `
Evaluate if the answer demonstrates understanding of Einstein's mass-energy equivalence.
The answer should explain:
1. What E, m, and c represent
2. The relationship between mass and energy
3. Why this is significant

User's Answer: "{userAnswer}"
`;

    const result = await this.aiService.customPromptValidation(
      userAnswer,
      customPrompt,
      {
        minConfidence: 0.8,
      }
    );

    console.log('Custom Validation:', result);

    return result;
  }

  /**
   * Example 4: Generate questions on a topic
   */
  async example4_GenerateQuestions() {
    const questions = await this.aiService.generateQuestions(
      'Quantum Mechanics',
      3,
      Difficulty.Medium,
      'multiple_choice'
    );

    console.log('Generated Questions:');
    questions.forEach((q, index) => {
      console.log(`\nQuestion ${index + 1}:`, {
        text: q.text,
        difficulty: q.difficulty,
        answers: q.answers,
        hints: q.hints,
      });
    });

    return questions;
  }

  /**
   * Example 5: Generate personalized feedback
   */
  async example5_GenerateFeedback() {
    const attempt = {
      score: 75,
      totalPoints: 100,
      timeSpent: 1800, // 30 minutes
      status: 'completed',
    };

    const submissions = [
      { questionId: 1, isCorrect: true, score: 10 },
      { questionId: 2, isCorrect: false, score: 5 },
      { questionId: 3, isCorrect: true, score: 10 },
      { questionId: 4, isCorrect: true, score: 10 },
      { questionId: 5, isCorrect: false, score: 0 },
    ];

    const feedback = await this.aiService.generateFeedback(attempt, submissions);

    console.log('Personalized Feedback:', {
      overallFeedback: feedback.overallFeedback,
      strengths: feedback.strengths,
      areasForImprovement: feedback.areasForImprovement,
      recommendations: feedback.recommendations,
    });

    return feedback;
  }

  /**
   * Example 6: Sentiment analysis
   */
  async example6_SentimentAnalysis() {
    const answer = 'I really enjoyed learning about this topic! It was fascinating and well-explained.';

    const sentiment = await this.aiService.analyzeAnswerSentiment(answer);

    console.log('Sentiment Analysis:', {
      score: sentiment.score,
      label: sentiment.label,
      confidence: sentiment.confidence,
      emotions: sentiment.emotions,
    });

    return sentiment;
  }

  /**
   * Example 7: Adjust question difficulty
   */
  async example7_AdjustDifficulty() {
    const originalQuestion = {
      text: 'What is 2 + 2?',
      type: 'short_answer',
      difficulty: Difficulty.VeryEasy,
      content: {
        text: 'What is 2 + 2?',
        correctAnswer: '4',
      },
    };

    const improvedQuestion = await this.aiService.improveDifficulty(
      originalQuestion,
      Difficulty.Hard
    );

    console.log('Original:', originalQuestion.text);
    console.log('Improved:', improvedQuestion.text);

    return improvedQuestion;
  }

  /**
   * Example 8: Combined validation approach
   */
  async example8_CombinedValidation() {
    const question = {
      text: 'Explain the water cycle.',
      content: {
        text: 'Explain the water cycle.',
        correctAnswer: 'The water cycle involves evaporation, condensation, precipitation, and collection.',
        rubric: [
          'Mentions evaporation',
          'Mentions condensation',
          'Mentions precipitation',
          'Explains the continuous nature',
        ],
      },
    };

    const userAnswer = 'Water evaporates from oceans, forms clouds through condensation, falls as rain, and flows back to the ocean.';

    // Step 1: Keyword check (fast)
    const keywordResult = await this.aiService.validateKeywords(userAnswer, {
      required: ['evaporat', 'condensation', 'rain', 'precipitation'],
      minMatches: 2,
      caseSensitive: false,
    });

    // Step 2: If keywords pass, do AI validation
    let finalResult;
    if (keywordResult.isValid) {
      finalResult = await this.aiService.validateMeaningMatch(
        question,
        userAnswer,
        0.8 // Higher sensitivity
      );
    } else {
      finalResult = keywordResult;
    }

    console.log('Combined Validation:', {
      keywordCheck: keywordResult.isValid,
      aiValidation: finalResult.isValid,
      finalScore: finalResult.score,
      feedback: finalResult.feedback,
    });

    return finalResult;
  }

  /**
   * Example 9: Main validateAnswer method with different check types
   */
  async example9_ValidateAnswerMethod() {
    const question = {
      text: 'What is the capital of France?',
      correctAnswer: 'Paris',
      content: {
        text: 'What is the capital of France?',
        correctAnswer: 'Paris',
      },
    };

    const userAnswer = 'Paris';

    // Using meaning check
    const meaningResult = await this.aiService.validateAnswer(
      question,
      userAnswer,
      {
        type: AICheckType.Meaning,
        sensitivity: 0.7,
      }
    );

    // Using sentiment check
    const sentimentResult = await this.aiService.validateAnswer(
      question,
      userAnswer,
      {
        type: AICheckType.Sentiment,
      }
    );

    // Using custom prompt
    const customResult = await this.aiService.validateAnswer(
      question,
      userAnswer,
      {
        type: AICheckType.Custom,
        customPrompt: 'Check if the answer correctly identifies Paris as the capital of France.',
        minConfidence: 0.9,
      }
    );

    console.log('Validation Results:', {
      meaning: meaningResult.isValid,
      sentiment: sentimentResult.sentiment,
      custom: customResult.isValid,
    });

    return { meaningResult, sentimentResult, customResult };
  }

  /**
   * Example 10: Health check
   */
  async example10_HealthCheck() {
    const health = await this.aiService.healthCheck();

    console.log('AI Service Health:', health);

    if (health.status !== 'healthy') {
      console.warn('AI service is not properly configured!');
    }

    return health;
  }

  /**
   * Example 11: Batch question generation
   */
  async example11_BatchGeneration() {
    const topics = ['Biology', 'Chemistry', 'Physics'];
    const difficulties = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard];

    const allQuestions = [];

    for (const topic of topics) {
      for (const difficulty of difficulties) {
        const questions = await this.aiService.generateQuestions(
          topic,
          2,
          difficulty,
          'multiple_choice'
        );

        allQuestions.push(...questions);
      }
    }

    console.log(`Generated ${allQuestions.length} questions across multiple topics and difficulties`);

    return allQuestions;
  }

  /**
   * Example 12: Progressive hint system
   */
  async example12_ProgressiveHints() {
    const question = {
      text: 'Solve for x: 2x + 5 = 15',
      correctAnswer: '5',
    };

    const userAttempts = [
      { answer: '10', isCorrect: false },
      { answer: '7', isCorrect: false },
      { answer: '5', isCorrect: true },
    ];

    const feedbacks = [];

    for (const [index, attempt] of userAttempts.entries()) {
      const result = await this.aiService.validateMeaningMatch(
        question,
        attempt.answer,
        0.9
      );

      feedbacks.push({
        attemptNumber: index + 1,
        answer: attempt.answer,
        isCorrect: result.isValid,
        feedback: result.feedback,
        suggestions: result.suggestions,
      });

      if (result.isValid) {
        break;
      }
    }

    console.log('Progressive Feedback:', feedbacks);

    return feedbacks;
  }
}

/**
 * Integration Example: Answer Validation in a Controller
 */
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';

class ValidateAnswerDto {
  questionId: number;
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  checkType: AICheckType;
  sensitivity?: number;
}

@Controller('ai-examples')
export class AIExampleController {
  constructor(private readonly aiService: AIService) {}

  @Post('validate')
  async validateAnswer(@Body() dto: ValidateAnswerDto) {
    const question = {
      text: dto.questionText,
      correctAnswer: dto.correctAnswer,
    };

    let result;

    switch (dto.checkType) {
      case AICheckType.Meaning:
        result = await this.aiService.validateMeaningMatch(
          question,
          dto.userAnswer,
          dto.sensitivity || 0.7
        );
        break;

      case AICheckType.Custom:
        result = await this.aiService.customPromptValidation(
          dto.userAnswer,
          `Evaluate if this answer is correct for the question: "${dto.questionText}"`
        );
        break;

      default:
        throw new BadRequestException('Unsupported check type');
    }

    return {
      questionId: dto.questionId,
      isValid: result.isValid,
      score: result.score,
      confidence: result.confidence,
      feedback: result.feedback,
      suggestions: result.suggestions,
    };
  }

  @Post('generate-questions')
  async generateQuestions(
    @Body() dto: { topic: string; count: number; difficulty: Difficulty }
  ) {
    const questions = await this.aiService.generateQuestions(
      dto.topic,
      dto.count,
      dto.difficulty,
      'multiple_choice'
    );

    return {
      topic: dto.topic,
      count: questions.length,
      questions,
    };
  }

  @Post('feedback')
  async generateFeedback(
    @Body() dto: { attempt: any; submissions: any[] }
  ) {
    const feedback = await this.aiService.generateFeedback(
      dto.attempt,
      dto.submissions
    );

    return feedback;
  }
}
