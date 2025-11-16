import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual, LessThanOrEqual, Brackets } from 'typeorm';
import { Questionnaire } from './entities/questionnaire.entity';
import { Question } from '../question/entities/question.entity';
import {
  CreateQuestionnaireDto,
  UpdateQuestionnaireDto,
  QueryQuestionnaireDto,
} from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { QuestionnaireType } from '../common/enums';

@Injectable()
export class QuestionnaireService {
  constructor(
    @InjectRepository(Questionnaire)
    private readonly questionnaireRepository: Repository<Questionnaire>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  /**
   * Create a new questionnaire
   */
  async create(
    createDto: CreateQuestionnaireDto,
    userId: number,
  ): Promise<Questionnaire> {
    // Validate date range
    if (createDto.startDate && createDto.endDate) {
      if (new Date(createDto.startDate) > new Date(createDto.endDate)) {
        throw new BadRequestException(
          'Start date must be before or equal to end date',
        );
      }
    }

    // Validate pass conditions
    if (createDto.passPercentage && createDto.passPoints) {
      throw new BadRequestException(
        'Cannot set both passPercentage and passPoints. Choose one.',
      );
    }

    const questionnaire = this.questionnaireRepository.create({
      ...createDto,
      created_by_id: userId,
    });

    return await this.questionnaireRepository.save(questionnaire);
  }

  /**
   * Find all questionnaires with pagination and filters
   */
  async findAll(
    queryDto: QueryQuestionnaireDto,
  ): Promise<PaginatedResponseDto<Questionnaire>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      category,
      difficulty,
      type,
      tags,
      isActive,
      isPublic,
      createdById,
      version,
      minQuestions,
      maxQuestions,
      availableFrom,
      availableUntil,
      currentlyAvailable,
      minTimeLimit,
      maxTimeLimit,
      minPoints,
      maxPoints,
    } = queryDto;

    const queryBuilder = this.questionnaireRepository
      .createQueryBuilder('questionnaire')
      .leftJoinAndSelect('questionnaire.createdBy', 'createdBy')
      .leftJoinAndSelect('questionnaire.questions', 'questions');

    // Search by name or description
    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('questionnaire.name ILIKE :search', {
            search: `%${search}%`,
          }).orWhere('questionnaire.description ILIKE :search', {
            search: `%${search}%`,
          });
        }),
      );
    }

    // Filter by category
    if (category) {
      queryBuilder.andWhere('questionnaire.category = :category', { category });
    }

    // Filter by difficulty
    if (difficulty) {
      queryBuilder.andWhere('questionnaire.difficulty = :difficulty', {
        difficulty,
      });
    }

    // Filter by type
    if (type) {
      queryBuilder.andWhere('questionnaire.type = :type', { type });
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map((tag) => tag.trim());
      queryBuilder.andWhere('questionnaire.tags && :tags', { tags: tagArray });
    }

    // Filter by active status
    if (isActive !== undefined) {
      queryBuilder.andWhere('questionnaire.isActive = :isActive', { isActive });
    }

    // Filter by public status
    if (isPublic !== undefined) {
      queryBuilder.andWhere('questionnaire.isPublic = :isPublic', { isPublic });
    }

    // Filter by creator
    if (createdById) {
      queryBuilder.andWhere('questionnaire.created_by_id = :createdById', {
        createdById,
      });
    }

    // Filter by version
    if (version) {
      queryBuilder.andWhere('questionnaire.version = :version', { version });
    }

    // Filter by availability dates
    if (availableFrom) {
      queryBuilder.andWhere(
        '(questionnaire.endDate IS NULL OR questionnaire.endDate >= :availableFrom)',
        { availableFrom },
      );
    }

    if (availableUntil) {
      queryBuilder.andWhere(
        '(questionnaire.startDate IS NULL OR questionnaire.startDate <= :availableUntil)',
        { availableUntil },
      );
    }

    // Filter currently available questionnaires
    if (currentlyAvailable) {
      const now = new Date();
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('questionnaire.isActive = :active', { active: true })
            .andWhere(
              new Brackets((dateQb) => {
                dateQb
                  .where('questionnaire.startDate IS NULL')
                  .orWhere('questionnaire.startDate <= :now', { now });
              }),
            )
            .andWhere(
              new Brackets((dateQb) => {
                dateQb
                  .where('questionnaire.endDate IS NULL')
                  .orWhere('questionnaire.endDate >= :now', { now });
              }),
            );
        }),
      );
    }

    // Filter by time limit
    if (minTimeLimit !== undefined) {
      queryBuilder.andWhere('questionnaire.timeLimit >= :minTimeLimit', {
        minTimeLimit,
      });
    }

    if (maxTimeLimit !== undefined) {
      queryBuilder.andWhere('questionnaire.timeLimit <= :maxTimeLimit', {
        maxTimeLimit,
      });
    }

    // Filter by points
    if (minPoints !== undefined) {
      queryBuilder.andWhere('questionnaire.points >= :minPoints', {
        minPoints,
      });
    }

    if (maxPoints !== undefined) {
      queryBuilder.andWhere('questionnaire.points <= :maxPoints', {
        maxPoints,
      });
    }

    // Clone query for counting
    const countQuery = queryBuilder.clone();

    // Apply sorting
    const allowedSortFields = [
      'name',
      'createdAt',
      'updatedAt',
      'difficulty',
      'category',
      'points',
      'timeLimit',
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`questionnaire.${sortField}`, sortOrder);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Execute queries
    const [questionnaires, total] = await Promise.all([
      queryBuilder.getMany(),
      countQuery.getCount(),
    ]);

    // Filter by question count (post-query due to relation count complexity)
    let filteredQuestionnaires = questionnaires;
    if (minQuestions !== undefined || maxQuestions !== undefined) {
      filteredQuestionnaires = questionnaires.filter((q) => {
        const questionCount = q.questions?.length || 0;
        if (minQuestions !== undefined && questionCount < minQuestions) {
          return false;
        }
        if (maxQuestions !== undefined && questionCount > maxQuestions) {
          return false;
        }
        return true;
      });
    }

    return new PaginatedResponseDto(filteredQuestionnaires, page, limit, total);
  }

  /**
   * Find one questionnaire by ID with all relations
   */
  async findOne(id: number): Promise<Questionnaire> {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id },
      relations: ['createdBy', 'questions', 'attempts'],
    });

    if (!questionnaire) {
      throw new NotFoundException(`Questionnaire with ID ${id} not found`);
    }

    return questionnaire;
  }

  /**
   * Update a questionnaire
   */
  async update(
    id: number,
    updateDto: UpdateQuestionnaireDto,
    userId: number,
  ): Promise<Questionnaire> {
    const questionnaire = await this.findOne(id);

    // Check ownership (will be supplemented by controller guard)
    if (questionnaire.created_by_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this questionnaire',
      );
    }

    // Validate date range if both provided
    if (updateDto.startDate && updateDto.endDate) {
      if (new Date(updateDto.startDate) > new Date(updateDto.endDate)) {
        throw new BadRequestException(
          'Start date must be before or equal to end date',
        );
      }
    }

    // Validate pass conditions
    if (updateDto.passPercentage && updateDto.passPoints) {
      throw new BadRequestException(
        'Cannot set both passPercentage and passPoints. Choose one.',
      );
    }

    Object.assign(questionnaire, updateDto);
    return await this.questionnaireRepository.save(questionnaire);
  }

  /**
   * Soft delete a questionnaire (set isActive to false)
   */
  async remove(id: number, userId?: number): Promise<Questionnaire> {
    const questionnaire = await this.findOne(id);

    // Check ownership if userId provided (for non-admin users)
    if (userId && questionnaire.created_by_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this questionnaire',
      );
    }

    questionnaire.isActive = false;
    return await this.questionnaireRepository.save(questionnaire);
  }

  /**
   * Add questions to a questionnaire
   */
  async addQuestions(
    questionnaireId: number,
    questionIds: number[],
  ): Promise<Questionnaire> {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: questionnaireId },
      relations: ['questions'],
    });

    if (!questionnaire) {
      throw new NotFoundException(
        `Questionnaire with ID ${questionnaireId} not found`,
      );
    }

    // Fetch questions to add
    const questionsToAdd = await this.questionRepository.find({
      where: { id: In(questionIds), isActive: true },
    });

    if (questionsToAdd.length !== questionIds.length) {
      const foundIds = questionsToAdd.map((q) => q.id);
      const missingIds = questionIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Questions with IDs ${missingIds.join(', ')} not found or inactive`,
      );
    }

    // Get existing question IDs to avoid duplicates
    const existingQuestionIds = questionnaire.questions.map((q) => q.id);
    const newQuestions = questionsToAdd.filter(
      (q) => !existingQuestionIds.includes(q.id),
    );

    if (newQuestions.length === 0) {
      throw new BadRequestException('All questions are already in the questionnaire');
    }

    questionnaire.questions = [...questionnaire.questions, ...newQuestions];
    return await this.questionnaireRepository.save(questionnaire);
  }

  /**
   * Remove questions from a questionnaire
   */
  async removeQuestions(
    questionnaireId: number,
    questionIds: number[],
  ): Promise<Questionnaire> {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: questionnaireId },
      relations: ['questions'],
    });

    if (!questionnaire) {
      throw new NotFoundException(
        `Questionnaire with ID ${questionnaireId} not found`,
      );
    }

    const originalCount = questionnaire.questions.length;
    questionnaire.questions = questionnaire.questions.filter(
      (q) => !questionIds.includes(q.id),
    );

    if (questionnaire.questions.length === originalCount) {
      throw new BadRequestException(
        'None of the specified questions were found in the questionnaire',
      );
    }

    return await this.questionnaireRepository.save(questionnaire);
  }

  /**
   * Get questions for a questionnaire (with optional filtering)
   */
  async getQuestions(
    questionnaireId: number,
    options?: {
      randomize?: boolean;
      limit?: number;
      includeInactive?: boolean;
    },
  ): Promise<Question[]> {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: questionnaireId },
      relations: ['questions'],
    });

    if (!questionnaire) {
      throw new NotFoundException(
        `Questionnaire with ID ${questionnaireId} not found`,
      );
    }

    let questions = questionnaire.questions;

    // Filter out inactive questions unless specified
    if (!options?.includeInactive) {
      questions = questions.filter((q) => q.isActive);
    }

    // Randomize if requested
    if (options?.randomize) {
      questions = this.shuffleArray([...questions]);
    }

    // Limit number of questions if specified
    if (options?.limit && options.limit > 0) {
      questions = questions.slice(0, options.limit);
    }

    return questions;
  }

  /**
   * Get random questions for RandomQuestions type questionnaire
   */
  async getRandomQuestions(questionnaireId: number): Promise<Question[]> {
    const questionnaire = await this.findOne(questionnaireId);

    if (questionnaire.type !== QuestionnaireType.RandomQuestions) {
      throw new BadRequestException(
        'This method is only for RandomQuestions type questionnaires',
      );
    }

    const maxQuestions = questionnaire.maxQuestions || 10;

    return await this.getQuestions(questionnaireId, {
      randomize: true,
      limit: maxQuestions,
      includeInactive: false,
    });
  }

  /**
   * Validate if a questionnaire is available
   */
  async validateAvailability(id: number): Promise<{
    available: boolean;
    reason?: string;
  }> {
    const questionnaire = await this.findOne(id);

    if (!this.isAvailable(questionnaire)) {
      return {
        available: false,
        reason: this.getUnavailabilityReason(questionnaire),
      };
    }

    return { available: true };
  }

  /**
   * Calculate total points for a questionnaire
   */
  async calculateTotalPoints(questionnaireId: number): Promise<number> {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: questionnaireId },
      relations: ['questions'],
    });

    if (!questionnaire) {
      throw new NotFoundException(
        `Questionnaire with ID ${questionnaireId} not found`,
      );
    }

    // If questionnaire has explicit points, use those
    if (questionnaire.points !== null && questionnaire.points !== undefined) {
      return questionnaire.points;
    }

    // Otherwise, sum up question points
    const totalPoints = questionnaire.questions.reduce((sum, question) => {
      return sum + (question.points || 0);
    }, 0);

    return totalPoints;
  }

  /**
   * Helper: Check if questionnaire is available (date range and active status)
   */
  isAvailable(questionnaire: Questionnaire): boolean {
    if (!questionnaire.isActive) {
      return false;
    }

    const now = new Date();

    // Check start date
    if (questionnaire.startDate && new Date(questionnaire.startDate) > now) {
      return false;
    }

    // Check end date
    if (questionnaire.endDate && new Date(questionnaire.endDate) < now) {
      return false;
    }

    return true;
  }

  /**
   * Helper: Get reason for unavailability
   */
  private getUnavailabilityReason(questionnaire: Questionnaire): string {
    if (!questionnaire.isActive) {
      return 'Questionnaire is inactive';
    }

    const now = new Date();

    if (questionnaire.startDate && new Date(questionnaire.startDate) > now) {
      return `Questionnaire will be available from ${questionnaire.startDate}`;
    }

    if (questionnaire.endDate && new Date(questionnaire.endDate) < now) {
      return `Questionnaire ended on ${questionnaire.endDate}`;
    }

    return 'Questionnaire is not available';
  }

  /**
   * Helper: Shuffle array (Fisher-Yates algorithm)
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
