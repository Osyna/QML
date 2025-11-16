import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Questionnaire, PathNode } from './entities/questionnaire.entity';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { Question } from './entities/question.entity';
import { PathNodeType } from '../common/enums/questionnaire-type.enum';

@Injectable()
export class QuestionnaireService {
  constructor(
    @InjectRepository(Questionnaire)
    private questionnaireRepository: Repository<Questionnaire>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async create(createQuestionnaireDto: CreateQuestionnaireDto): Promise<Questionnaire> {
    const questionnaire = this.questionnaireRepository.create(createQuestionnaireDto);
    return this.questionnaireRepository.save(questionnaire);
  }

  async findAll(): Promise<Questionnaire[]> {
    return this.questionnaireRepository.find();
  }

  async findOne(id: number): Promise<Questionnaire> {
    const questionnaire = await this.questionnaireRepository.findOne({ where: { id } });
    if (!questionnaire) {
      throw new NotFoundException(`Questionnaire with ID ${id} not found`);
    }
    return questionnaire;
  }

  async update(id: number, updateQuestionnaireDto: UpdateQuestionnaireDto): Promise<Questionnaire> {
    const questionnaire = await this.findOne(id);
    Object.assign(questionnaire, updateQuestionnaireDto);
    questionnaire.updatedAt = new Date();
    return this.questionnaireRepository.save(questionnaire);
  }

  async remove(id: number): Promise<void> {
    const questionnaire = await this.findOne(id);
    await this.questionnaireRepository.remove(questionnaire);
  }

  async findByCategory(category: string): Promise<Questionnaire[]> {
    return this.questionnaireRepository.find({ where: { category } });
  }

  /**
   * Get the next question in a path-based questionnaire
   */
  async getNextQuestion(
    questionnaireId: number,
    currentQuestionId?: number,
    userAnswer?: string,
  ): Promise<Question | null> {
    const questionnaire = await this.findOne(questionnaireId);

    if (!questionnaire.pool || questionnaire.pool.length === 0) {
      return null;
    }

    // If no current question, return the first question
    if (!currentQuestionId) {
      const firstNode = questionnaire.pool[0];
      return this.getQuestionFromNode(firstNode);
    }

    // Find the current node and determine next based on answer
    const nextNode = this.findNextNode(questionnaire.pool, currentQuestionId, userAnswer);
    if (!nextNode) {
      return null;
    }

    return this.getQuestionFromNode(nextNode);
  }

  /**
   * Get question from a path node
   */
  private async getQuestionFromNode(node: PathNode): Promise<Question | null> {
    if (node.type === PathNodeType.Question && node.question) {
      return this.questionRepository.findOne({ where: { id: node.question } });
    } else if (node.type === PathNodeType.Path && node.question) {
      return this.questionRepository.findOne({ where: { id: node.question } });
    }
    return null;
  }

  /**
   * Find the next node based on current question and user answer
   */
  private findNextNode(
    pool: PathNode[],
    currentQuestionId: number,
    userAnswer?: string,
  ): PathNode | null {
    for (const node of pool) {
      if (node.question === currentQuestionId && node.type === PathNodeType.Path) {
        // Path node - determine next based on answer
        if (userAnswer && node.answers && node.answers[userAnswer]) {
          return node.answers[userAnswer];
        }
      } else if (node.question === currentQuestionId && node.type === PathNodeType.Question) {
        // Regular question - move to next in pool
        const currentIndex = pool.indexOf(node);
        if (currentIndex < pool.length - 1) {
          return pool[currentIndex + 1];
        }
        return null;
      }

      // Recursively search in answer paths
      if (node.answers) {
        for (const answerKey in node.answers) {
          const result = this.findNextNode([node.answers[answerKey]], currentQuestionId, userAnswer);
          if (result) {
            return result;
          }
        }
      }
    }

    return null;
  }
}
