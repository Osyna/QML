import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Question } from './entities/question.entity';
import { QuestionVersion } from '../versioning/entities/question-version.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { Difficulty } from '../common/enums';
import { VersioningService } from '../versioning/versioning.service';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(QuestionVersion)
    private questionVersionRepository: Repository<QuestionVersion>,
    private versioningService: VersioningService,
  ) {}

  /**
   * Create a new question with proper relations
   */
  async create(createQuestionDto: CreateQuestionDto, userId: number): Promise<Question> {
    // Populate searchable content from question content
    const searchableContent = this.buildSearchableContent(createQuestionDto.content);

    const question = this.questionRepository.create({
      ...createQuestionDto,
      searchableContent,
      created_by_id: userId,
      version: createQuestionDto.version || '1.0',
    });

    const savedQuestion = await this.questionRepository.save(question);

    // Create initial version history using versioning service
    await this.versioningService.createVersion(
      savedQuestion,
      'Initial version',
      userId,
    );

    // Load relations and return
    return this.findOne(savedQuestion.id);
  }

  /**
   * Find all questions with pagination, filtering, and search
   */
  async findAll(queryDto: QueryQuestionDto): Promise<PaginatedResponseDto<Question>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      type,
      difficulty,
      category,
      checkType,
      isActive,
      isPublic,
      createdById,
      minPoints,
      maxPoints,
      minTimeLimit,
      maxTimeLimit,
      minAverageScore,
      maxAverageScore,
      minTotalAttempts,
      tags,
      version,
      createdAfter,
      createdBefore,
      updatedAfter,
      updatedBefore,
      hasMultimedia,
      hasHints,
      poolId,
      questionnaireId,
    } = queryDto;

    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.createdBy', 'createdBy')
      .leftJoinAndSelect('question.pools', 'pools')
      .leftJoinAndSelect('question.questionnaires', 'questionnaires');

    // Apply filters
    if (type) {
      queryBuilder.andWhere('question.type = :type', { type });
    }

    if (difficulty) {
      queryBuilder.andWhere('question.difficulty = :difficulty', { difficulty });
    }

    if (category) {
      queryBuilder.andWhere('question.category = :category', { category });
    }

    if (checkType) {
      queryBuilder.andWhere('question.checkType = :checkType', { checkType });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('question.isActive = :isActive', { isActive });
    }

    if (isPublic !== undefined) {
      queryBuilder.andWhere('question.isPublic = :isPublic', { isPublic });
    }

    if (createdById) {
      queryBuilder.andWhere('question.created_by_id = :createdById', { createdById });
    }

    if (minPoints !== undefined) {
      queryBuilder.andWhere('question.points >= :minPoints', { minPoints });
    }

    if (maxPoints !== undefined) {
      queryBuilder.andWhere('question.points <= :maxPoints', { maxPoints });
    }

    if (minTimeLimit !== undefined) {
      queryBuilder.andWhere('question.timeLimit >= :minTimeLimit', { minTimeLimit });
    }

    if (maxTimeLimit !== undefined) {
      queryBuilder.andWhere('question.timeLimit <= :maxTimeLimit', { maxTimeLimit });
    }

    if (minAverageScore !== undefined) {
      queryBuilder.andWhere('question.averageScore >= :minAverageScore', { minAverageScore });
    }

    if (maxAverageScore !== undefined) {
      queryBuilder.andWhere('question.averageScore <= :maxAverageScore', { maxAverageScore });
    }

    if (minTotalAttempts !== undefined) {
      queryBuilder.andWhere('question.totalAttempts >= :minTotalAttempts', { minTotalAttempts });
    }

    if (version) {
      queryBuilder.andWhere('question.version = :version', { version });
    }

    if (createdAfter) {
      queryBuilder.andWhere('question.createdAt >= :createdAfter', { createdAfter });
    }

    if (createdBefore) {
      queryBuilder.andWhere('question.createdAt <= :createdBefore', { createdBefore });
    }

    if (updatedAfter) {
      queryBuilder.andWhere('question.updatedAt >= :updatedAfter', { updatedAfter });
    }

    if (updatedBefore) {
      queryBuilder.andWhere('question.updatedAt <= :updatedBefore', { updatedBefore });
    }

    // Full-text search on searchableContent
    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('question.searchableContent ILIKE :search', {
            search: `%${search}%`,
          })
            .orWhere('question.category ILIKE :search', { search: `%${search}%` })
            .orWhere(
              "question.content::text ILIKE :search",
              { search: `%${search}%` },
            );
        }),
      );
    }

    // Filter by tags (must include all specified tags)
    if (tags && tags.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          tags.forEach((tag, index) => {
            qb.andWhere(`question.content::jsonb -> 'tags' ? :tag${index}`, {
              [`tag${index}`]: tag,
            });
          });
        }),
      );
    }

    // Filter by multimedia presence
    if (hasMultimedia !== undefined) {
      if (hasMultimedia) {
        queryBuilder.andWhere(
          "question.content::jsonb -> 'multimedia' IS NOT NULL",
        );
      } else {
        queryBuilder.andWhere(
          "question.content::jsonb -> 'multimedia' IS NULL",
        );
      }
    }

    // Filter by hints presence
    if (hasHints !== undefined) {
      if (hasHints) {
        queryBuilder.andWhere(
          "jsonb_array_length(question.content::jsonb -> 'hints') > 0",
        );
      } else {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where("question.content::jsonb -> 'hints' IS NULL")
              .orWhere("jsonb_array_length(question.content::jsonb -> 'hints') = 0");
          }),
        );
      }
    }

    // Filter by pool
    if (poolId) {
      queryBuilder.andWhere('pools.id = :poolId', { poolId });
    }

    // Filter by questionnaire
    if (questionnaireId) {
      queryBuilder.andWhere('questionnaires.id = :questionnaireId', { questionnaireId });
    }

    // Sorting
    const allowedSortFields = [
      'id',
      'type',
      'difficulty',
      'category',
      'points',
      'timeLimit',
      'totalAttempts',
      'correctAttempts',
      'averageScore',
      'averageTimeSpent',
      'createdAt',
      'updatedAt',
    ];

    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`question.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('question.createdAt', sortOrder);
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, page, limit, total);
  }

  /**
   * Find one question by ID with relations
   */
  async findOne(id: number): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['createdBy', 'pools', 'questionnaires', 'versions'],
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return question;
  }

  /**
   * Update a question and create version history
   */
  async update(
    id: number,
    updateQuestionDto: UpdateQuestionDto,
    userId: number,
  ): Promise<Question> {
    const question = await this.findOne(id);

    // Check ownership (owner or admin check should be done in controller)

    // Update searchable content if content is being updated
    if (updateQuestionDto.content) {
      const searchableContent = this.buildSearchableContent(updateQuestionDto.content);
      updateQuestionDto['searchableContent'] = searchableContent;
    }

    // Increment version if significant changes
    const shouldIncrementVersion = this.shouldIncrementVersion(updateQuestionDto);
    if (shouldIncrementVersion) {
      const newVersion = this.incrementVersion(question.version);
      updateQuestionDto['version'] = newVersion;
    }

    // Merge updates
    Object.assign(question, updateQuestionDto);
    const updatedQuestion = await this.questionRepository.save(question);

    // Create version history using versioning service
    await this.versioningService.createVersion(
      updatedQuestion,
      'Question updated',
      userId,
    );

    return this.findOne(id);
  }

  /**
   * Soft delete a question (set isActive to false)
   */
  async remove(id: number): Promise<Question> {
    const question = await this.findOne(id);

    question.isActive = false;
    await this.questionRepository.save(question);

    return question;
  }

  /**
   * Full-text search on searchableContent
   */
  async search(searchText: string, limit: number = 20): Promise<Question[]> {
    return this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.createdBy', 'createdBy')
      .where('question.isActive = :isActive', { isActive: true })
      .andWhere(
        new Brackets((qb) => {
          qb.where('question.searchableContent ILIKE :search', {
            search: `%${searchText}%`,
          })
            .orWhere('question.category ILIKE :search', {
              search: `%${searchText}%`,
            })
            .orWhere(
              "question.content::text ILIKE :search",
              { search: `%${searchText}%` },
            );
        }),
      )
      .orderBy('question.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Find questions by category
   */
  async findByCategory(category: string): Promise<Question[]> {
    return this.questionRepository.find({
      where: { category, isActive: true },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find questions by difficulty
   */
  async findByDifficulty(difficulty: Difficulty): Promise<Question[]> {
    return this.questionRepository.find({
      where: { difficulty, isActive: true },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update question statistics
   */
  async updateStatistics(
    questionId: number,
    stats: {
      totalAttempts?: number;
      correctAttempts?: number;
      averageScore?: number;
      averageTimeSpent?: number;
    },
  ): Promise<Question> {
    const question = await this.findOne(questionId);

    if (stats.totalAttempts !== undefined) {
      question.totalAttempts = stats.totalAttempts;
    }

    if (stats.correctAttempts !== undefined) {
      question.correctAttempts = stats.correctAttempts;
    }

    if (stats.averageScore !== undefined) {
      question.averageScore = stats.averageScore;
    }

    if (stats.averageTimeSpent !== undefined) {
      question.averageTimeSpent = stats.averageTimeSpent;
    }

    return this.questionRepository.save(question);
  }

  /**
   * Get question statistics
   */
  async getStatistics(questionId: number): Promise<{
    totalAttempts: number;
    correctAttempts: number;
    averageScore: number;
    averageTimeSpent: number;
    successRate: number;
  }> {
    const question = await this.findOne(questionId);

    const successRate =
      question.totalAttempts > 0
        ? question.correctAttempts / question.totalAttempts
        : 0;

    return {
      totalAttempts: question.totalAttempts,
      correctAttempts: question.correctAttempts,
      averageScore: question.averageScore || 0,
      averageTimeSpent: question.averageTimeSpent || 0,
      successRate,
    };
  }

  /**
   * Build searchable content from question content
   */
  private buildSearchableContent(content: any): string {
    const parts: string[] = [];

    if (content.text) {
      parts.push(content.text);
    }

    if (content.answers && Array.isArray(content.answers)) {
      content.answers.forEach((answer: any) => {
        if (answer.answerText) {
          parts.push(answer.answerText);
        }
        if (answer.explanation) {
          parts.push(answer.explanation);
        }
      });
    }

    if (content.hints && Array.isArray(content.hints)) {
      content.hints.forEach((hint: any) => {
        if (hint.hintText) {
          parts.push(hint.hintText);
        }
      });
    }

    if (content.feedback) {
      if (content.feedback.correct) {
        parts.push(content.feedback.correct);
      }
      if (content.feedback.incorrect) {
        parts.push(content.feedback.incorrect);
      }
      if (content.feedback.partial) {
        parts.push(content.feedback.partial);
      }
    }

    if (content.tags && Array.isArray(content.tags)) {
      parts.push(...content.tags);
    }

    return parts.join(' ');
  }

  /**
   * Determine if version should be incremented based on changes
   */
  private shouldIncrementVersion(updateDto: UpdateQuestionDto): boolean {
    // Increment version if any of these significant fields are changed
    const significantFields = [
      'type',
      'content',
      'checkType',
      'checkConfig',
      'points',
      'difficulty',
    ];

    return significantFields.some((field) => updateDto[field] !== undefined);
  }

  /**
   * Increment semantic version (e.g., "1.0" -> "1.1")
   */
  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    if (parts.length === 2) {
      const major = parseInt(parts[0], 10);
      const minor = parseInt(parts[1], 10);
      return `${major}.${minor + 1}`;
    }
    return currentVersion;
  }

  /**
   * Hard delete a question (for admin use only)
   */
  async hardDelete(id: number): Promise<void> {
    const question = await this.findOne(id);
    await this.questionRepository.remove(question);
  }

  /**
   * Restore a soft-deleted question
   */
  async restore(id: number): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    question.isActive = true;
    await this.questionRepository.save(question);

    return this.findOne(id);
  }

  /**
   * Get all versions of a question
   */
  async getVersionHistory(questionId: number): Promise<QuestionVersion[]> {
    return this.versioningService.getVersionHistory(questionId);
  }

  /**
   * Duplicate a question
   */
  async duplicate(id: number, userId: number): Promise<Question> {
    const original = await this.findOne(id);

    const duplicateData: CreateQuestionDto = {
      type: original.type,
      minChar: original.minChar,
      maxChar: original.maxChar,
      checkType: original.checkType,
      checkConfig: original.checkConfig as any,
      points: original.points,
      difficulty: original.difficulty,
      category: original.category,
      timeLimit: original.timeLimit,
      content: original.content as any,
      isActive: true,
      isPublic: false,
      version: '1.0',
    };

    return this.create(duplicateData, userId);
  }
}
