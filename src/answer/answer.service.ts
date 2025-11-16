import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from './entities/answer.entity';
import { Question } from '../question/entities/question.entity';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { AnswerResponseDto } from './dto/answer-response.dto';
import { AnswerValidationService } from './answer-validation.service';

@Injectable()
export class AnswerService {
  constructor(
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    private answerValidationService: AnswerValidationService,
  ) {}

  async submitAnswer(submitAnswerDto: SubmitAnswerDto): Promise<AnswerResponseDto> {
    // Find the question
    const question = await this.questionRepository.findOne({
      where: { id: submitAnswerDto.questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${submitAnswerDto.questionId} not found`);
    }

    // Validate the answer
    const validationResult = await this.answerValidationService.validateAnswer(
      question,
      submitAnswerDto.userAnswer,
      submitAnswerDto.usedHints,
    );

    // Create and save the answer
    const answer = this.answerRepository.create({
      ...submitAnswerDto,
      validationResult,
    });

    const savedAnswer = await this.answerRepository.save(answer);

    return savedAnswer;
  }

  async findAll(): Promise<Answer[]> {
    return this.answerRepository.find();
  }

  async findOne(id: number): Promise<Answer> {
    const answer = await this.answerRepository.findOne({ where: { id } });
    if (!answer) {
      throw new NotFoundException(`Answer with ID ${id} not found`);
    }
    return answer;
  }

  async findByQuestion(questionId: number): Promise<Answer[]> {
    return this.answerRepository.find({ where: { questionId } });
  }

  async findByQuestionnaire(questionnaireId: number): Promise<Answer[]> {
    return this.answerRepository.find({ where: { questionnaireId } });
  }

  async findByUser(userId: string): Promise<Answer[]> {
    return this.answerRepository.find({ where: { userId } });
  }
}
