import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question,QuestionPool,Questionnaire } from './question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuestionPoolDto } from './dto/create-question-pool.dto';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const question = this.questionRepository.create(createQuestionDto);
    return this.questionRepository.save(question);
  }

  async findAll(): Promise<Question[]> {
    return this.questionRepository.find();
  }

  async findOne(id: number): Promise<Question> {
    return this.questionRepository.findOne({ where: { id } });
  }

  async update(id: number, updateQuestionDto: CreateQuestionDto): Promise<Question> {
    await this.questionRepository.update(id, updateQuestionDto);
    return this.questionRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.questionRepository.delete(id);
  }
}


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
    return this.questionPoolRepository.findOne({ where: { id } });
  }

  async update(id: number, updateQuestionPoolDto: CreateQuestionPoolDto): Promise<QuestionPool> {
    await this.questionPoolRepository.update(id, updateQuestionPoolDto);
    return this.questionPoolRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.questionPoolRepository.delete(id);
  }
}



@Injectable()
export class QuestionnaireService {
  constructor(
    @InjectRepository(Questionnaire)
    private questionnaireRepository: Repository<Questionnaire>,
  ) {}

  async create(createQuestionnaireDto: CreateQuestionnaireDto): Promise<Questionnaire> {
    const questionnaire = this.questionnaireRepository.create(createQuestionnaireDto);
    return this.questionnaireRepository.save(questionnaire);
  }

  async findAll(): Promise<Questionnaire[]> {
    return this.questionnaireRepository.find();
  }

  async findOne(id: number): Promise<Questionnaire> {
    return this.questionnaireRepository.findOne({ where: { id } });
  }

  async update(id: number, updateQuestionnaireDto: CreateQuestionnaireDto): Promise<Questionnaire> {
    await this.questionnaireRepository.update(id, updateQuestionnaireDto);
    return this.questionnaireRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.questionnaireRepository.delete(id);
  }
}