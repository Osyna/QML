import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
import { QuestionPool } from './entities/question-pool.entity';
import { Question } from '../question/entities/question.entity';
import { CreateQuestionPoolDto } from './dto/create-question-pool.dto';
import { UpdateQuestionPoolDto } from './dto/update-question-pool.dto';
import { QueryQuestionPoolDto } from './dto/query-question-pool.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { Role } from '../common/enums';

@Injectable()
export class QuestionPoolService {
  constructor(
    @InjectRepository(QuestionPool)
    private readonly questionPoolRepository: Repository<QuestionPool>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  /**
   * Create a new question pool
   * @param createDto - The data for creating a question pool
   * @param userId - The ID of the user creating the pool
   * @returns The created question pool
   */
  async create(
    createDto: CreateQuestionPoolDto,
    userId: number,
  ): Promise<QuestionPool> {
    const questionPool = this.questionPoolRepository.create({
      ...createDto,
      created_by_id: userId,
    });

    return await this.questionPoolRepository.save(questionPool);
  }

  /**
   * Find all question pools with pagination and filters
   * @param queryDto - Query parameters for filtering, pagination, and sorting
   * @returns Paginated list of question pools
   */
  async findAll(
    queryDto: QueryQuestionPoolDto,
  ): Promise<PaginatedResponseDto<QuestionPool>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      category,
      difficulty,
      tags,
      isActive,
      isPublic,
      createdById,
      version,
      minQuestions,
      maxQuestions,
    } = queryDto;

    const queryBuilder = this.questionPoolRepository
      .createQueryBuilder('pool')
      .leftJoinAndSelect('pool.createdBy', 'createdBy')
      .leftJoin('pool.questions', 'question');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(pool.name) LIKE LOWER(:search) OR LOWER(pool.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('pool.category = :category', { category });
    }

    if (difficulty) {
      queryBuilder.andWhere('pool.difficulty = :difficulty', { difficulty });
    }

    if (tags) {
      const tagArray = tags.split(',').map((tag) => tag.trim());
      // Check if pool.tags contains any of the specified tags
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM unnest(pool.tags) AS tag
          WHERE tag IN (:...tagArray)
        )`,
        { tagArray },
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('pool.isActive = :isActive', { isActive });
    }

    if (isPublic !== undefined) {
      queryBuilder.andWhere('pool.isPublic = :isPublic', { isPublic });
    }

    if (createdById) {
      queryBuilder.andWhere('pool.created_by_id = :createdById', {
        createdById,
      });
    }

    if (version) {
      queryBuilder.andWhere('pool.version = :version', { version });
    }

    // Filter by question count
    if (minQuestions !== undefined || maxQuestions !== undefined) {
      queryBuilder.groupBy('pool.id').addGroupBy('createdBy.id');
      queryBuilder.having('COUNT(question.id) >= :minQuestions', {
        minQuestions: minQuestions || 0,
      });
      if (maxQuestions !== undefined) {
        queryBuilder.andHaving('COUNT(question.id) <= :maxQuestions', {
          maxQuestions,
        });
      }
    }

    // Count total items
    const total = await queryBuilder.getCount();

    // Apply sorting
    const allowedSortFields = [
      'name',
      'createdAt',
      'updatedAt',
      'difficulty',
      'category',
      'version',
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`pool.${sortField}`, sortOrder);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const pools = await queryBuilder.getMany();

    return new PaginatedResponseDto(pools, page, limit, total);
  }

  /**
   * Find a single question pool by ID with relations
   * @param id - The ID of the question pool
   * @returns The question pool with relations
   */
  async findOne(id: number): Promise<QuestionPool> {
    const pool = await this.questionPoolRepository.findOne({
      where: { id },
      relations: ['questions', 'createdBy'],
    });

    if (!pool) {
      throw new NotFoundException(`Question pool with ID ${id} not found`);
    }

    return pool;
  }

  /**
   * Update a question pool
   * @param id - The ID of the question pool to update
   * @param updateDto - The data to update
   * @param userId - The ID of the user performing the update
   * @param userRole - The role of the user performing the update
   * @returns The updated question pool
   */
  async update(
    id: number,
    updateDto: UpdateQuestionPoolDto,
    userId: number,
    userRole?: Role,
  ): Promise<QuestionPool> {
    const pool = await this.findOne(id);

    // Check authorization: owner or admin
    if (pool.created_by_id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to update this question pool',
      );
    }

    Object.assign(pool, updateDto);
    return await this.questionPoolRepository.save(pool);
  }

  /**
   * Soft delete a question pool (set isActive to false)
   * @param id - The ID of the question pool to delete
   * @param userId - The ID of the user performing the deletion
   * @param userRole - The role of the user performing the deletion
   */
  async remove(id: number, userId: number, userRole?: Role): Promise<void> {
    const pool = await this.findOne(id);

    // Check authorization: owner or admin
    if (pool.created_by_id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this question pool',
      );
    }

    // Soft delete by setting isActive to false
    pool.isActive = false;
    await this.questionPoolRepository.save(pool);
  }

  /**
   * Add questions to a question pool
   * @param poolId - The ID of the question pool
   * @param questionIds - Array of question IDs to add
   * @param userId - The ID of the user performing the action
   * @param userRole - The role of the user performing the action
   * @returns The updated question pool
   */
  async addQuestions(
    poolId: number,
    questionIds: number[],
    userId: number,
    userRole?: Role,
  ): Promise<QuestionPool> {
    const pool = await this.findOne(poolId);

    // Check authorization: owner or admin
    if (pool.created_by_id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to modify this question pool',
      );
    }

    // Find questions
    const questions = await this.questionRepository.find({
      where: { id: In(questionIds) },
    });

    if (questions.length !== questionIds.length) {
      const foundIds = questions.map((q) => q.id);
      const missingIds = questionIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Questions with IDs ${missingIds.join(', ')} not found`,
      );
    }

    // Get existing question IDs
    const existingQuestionIds = pool.questions?.map((q) => q.id) || [];

    // Filter out questions that are already in the pool
    const newQuestions = questions.filter(
      (q) => !existingQuestionIds.includes(q.id),
    );

    if (newQuestions.length === 0) {
      throw new BadRequestException(
        'All specified questions are already in the pool',
      );
    }

    // Add new questions to the pool
    pool.questions = [...(pool.questions || []), ...newQuestions];

    return await this.questionPoolRepository.save(pool);
  }

  /**
   * Remove questions from a question pool
   * @param poolId - The ID of the question pool
   * @param questionIds - Array of question IDs to remove
   * @param userId - The ID of the user performing the action
   * @param userRole - The role of the user performing the action
   * @returns The updated question pool
   */
  async removeQuestions(
    poolId: number,
    questionIds: number[],
    userId: number,
    userRole?: Role,
  ): Promise<QuestionPool> {
    const pool = await this.findOne(poolId);

    // Check authorization: owner or admin
    if (pool.created_by_id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to modify this question pool',
      );
    }

    if (!pool.questions || pool.questions.length === 0) {
      throw new BadRequestException('This pool has no questions');
    }

    // Remove questions
    pool.questions = pool.questions.filter(
      (q) => !questionIds.includes(q.id),
    );

    return await this.questionPoolRepository.save(pool);
  }

  /**
   * Get questions in a pool with optional filters
   * @param poolId - The ID of the question pool
   * @param filters - Optional filters for questions
   * @returns Array of questions in the pool
   */
  async getQuestions(
    poolId: number,
    filters?: {
      difficulty?: string;
      category?: string;
      type?: string;
      isActive?: boolean;
    },
  ): Promise<Question[]> {
    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .innerJoin('question.pools', 'pool', 'pool.id = :poolId', { poolId });

    // Apply filters
    if (filters?.difficulty) {
      queryBuilder.andWhere('question.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }

    if (filters?.category) {
      queryBuilder.andWhere('question.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('question.type = :type', {
        type: filters.type,
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('question.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get random questions from a pool
   * @param poolId - The ID of the question pool
   * @param count - Number of random questions to retrieve
   * @returns Array of random questions from the pool
   */
  async getRandomQuestions(poolId: number, count: number): Promise<Question[]> {
    if (count <= 0) {
      throw new BadRequestException('Count must be greater than 0');
    }

    const pool = await this.findOne(poolId);

    if (!pool.questions || pool.questions.length === 0) {
      throw new BadRequestException('This pool has no questions');
    }

    if (count > pool.questions.length) {
      throw new BadRequestException(
        `Pool only has ${pool.questions.length} questions, but ${count} were requested`,
      );
    }

    // Get random questions using SQL
    const questions = await this.questionRepository
      .createQueryBuilder('question')
      .innerJoin('question.pools', 'pool', 'pool.id = :poolId', { poolId })
      .andWhere('question.isActive = :isActive', { isActive: true })
      .orderBy('RANDOM()')
      .take(count)
      .getMany();

    return questions;
  }

  /**
   * Check if a user is the owner of a question pool
   * @param poolId - The ID of the question pool
   * @param userId - The ID of the user
   * @returns True if the user is the owner
   */
  async isOwner(poolId: number, userId: number): Promise<boolean> {
    const pool = await this.questionPoolRepository.findOne({
      where: { id: poolId },
      select: ['id', 'created_by_id'],
    });

    if (!pool) {
      throw new NotFoundException(`Question pool with ID ${poolId} not found`);
    }

    return pool.created_by_id === userId;
  }
}
