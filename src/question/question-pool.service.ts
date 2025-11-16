import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionPool } from './entities/question-pool.entity';
import { CreateQuestionPoolDto } from './dto/create-question-pool.dto';
import { UpdateQuestionPoolDto } from './dto/update-question-pool.dto';

@Injectable()
export class QuestionPoolService {
  constructor(
    @InjectRepository(QuestionPool)
    private questionPoolRepository: Repository<QuestionPool>,
  ) {}

  async create(createQuestionPoolDto: CreateQuestionPoolDto): Promise<QuestionPool> {
    const questionPool = this.questionPoolRepository.create(createQuestionPoolDto);
    return this.questionPoolRepository.save(questionPool);
  }

  async findAll(): Promise<QuestionPool[]> {
    return this.questionPoolRepository.find();
  }

  async findOne(id: number): Promise<QuestionPool> {
    const questionPool = await this.questionPoolRepository.findOne({ where: { id } });
    if (!questionPool) {
      throw new NotFoundException(`Question Pool with ID ${id} not found`);
    }
    return questionPool;
  }

  async update(id: number, updateQuestionPoolDto: UpdateQuestionPoolDto): Promise<QuestionPool> {
    const questionPool = await this.findOne(id);
    Object.assign(questionPool, updateQuestionPoolDto);
    questionPool.updatedAt = new Date();
    return this.questionPoolRepository.save(questionPool);
  }

  async remove(id: number): Promise<void> {
    const questionPool = await this.findOne(id);
    await this.questionPoolRepository.remove(questionPool);
  }

  async addQuestions(id: number, questionIds: number[]): Promise<QuestionPool> {
    const questionPool = await this.findOne(id);
    const currentPool = questionPool.pool || [];
    questionPool.pool = [...new Set([...currentPool, ...questionIds])];
    questionPool.updatedAt = new Date();
    return this.questionPoolRepository.save(questionPool);
  }

  async removeQuestions(id: number, questionIds: number[]): Promise<QuestionPool> {
    const questionPool = await this.findOne(id);
    const currentPool = questionPool.pool || [];
    questionPool.pool = currentPool.filter((qId) => !questionIds.includes(qId));
    questionPool.updatedAt = new Date();
    return this.questionPoolRepository.save(questionPool);
  }

  async findByCategory(category: string): Promise<QuestionPool[]> {
    return this.questionPoolRepository.find({ where: { category } });
  }
}
