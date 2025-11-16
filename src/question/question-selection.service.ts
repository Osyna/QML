import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { QuestionPool } from './entities/question-pool.entity';
import { Questionnaire, PathNode } from './entities/questionnaire.entity';
import { QuestionnaireType, PathNodeType } from '../common/enums/questionnaire-type.enum';

@Injectable()
export class QuestionSelectionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(QuestionPool)
    private questionPoolRepository: Repository<QuestionPool>,
  ) {}

  /**
   * Get questions for a questionnaire based on its type
   */
  async getQuestionsForQuestionnaire(questionnaire: Questionnaire): Promise<Question[]> {
    if (!questionnaire.pool || questionnaire.pool.length === 0) {
      return [];
    }

    switch (questionnaire.type) {
      case QuestionnaireType.Questionnaire:
      case QuestionnaireType.PathBased:
        return this.getQuestionsFromPool(questionnaire.pool);

      case QuestionnaireType.RandomQuestions:
        return this.getRandomQuestionsFromPool(
          questionnaire.pool,
          questionnaire.maxQuestions,
        );

      case QuestionnaireType.Survey:
        return this.getQuestionsFromPool(questionnaire.pool);

      default:
        return this.getQuestionsFromPool(questionnaire.pool);
    }
  }

  /**
   * Get all questions from a pool structure
   */
  private async getQuestionsFromPool(pool: PathNode[]): Promise<Question[]> {
    const questionIds = this.extractQuestionIds(pool);
    const uniqueIds = [...new Set(questionIds)];

    if (uniqueIds.length === 0) {
      return [];
    }

    return this.questionRepository.findByIds(uniqueIds);
  }

  /**
   * Get random questions from a pool
   */
  private async getRandomQuestionsFromPool(
    pool: PathNode[],
    maxQuestions?: number,
  ): Promise<Question[]> {
    const allQuestions = await this.getQuestionsFromPool(pool);

    if (!maxQuestions || maxQuestions >= allQuestions.length) {
      return this.shuffleArray(allQuestions);
    }

    const shuffled = this.shuffleArray(allQuestions);
    return shuffled.slice(0, maxQuestions);
  }

  /**
   * Extract all question IDs from a pool structure
   */
  private extractQuestionIds(pool: PathNode[]): number[] {
    const ids: number[] = [];

    for (const node of pool) {
      if (node.question) {
        ids.push(node.question);
      }

      if (node.answers) {
        for (const answerKey in node.answers) {
          const childIds = this.extractQuestionIds([node.answers[answerKey]]);
          ids.push(...childIds);
        }
      }
    }

    return ids;
  }

  /**
   * Get random questions from a question pool by ID
   */
  async getRandomQuestionsFromPoolById(
    poolId: number,
    count?: number,
  ): Promise<Question[]> {
    const pool = await this.questionPoolRepository.findOne({ where: { id: poolId } });

    if (!pool || !pool.pool || pool.pool.length === 0) {
      return [];
    }

    const questions = await this.questionRepository.findByIds(pool.pool);

    if (!count || count >= questions.length) {
      return this.shuffleArray(questions);
    }

    const shuffled = this.shuffleArray(questions);
    return shuffled.slice(0, count);
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
