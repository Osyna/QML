import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { AnswerService } from './answer.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { AnswerResponseDto } from './dto/answer-response.dto';

@Controller('answers')
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Post()
  async submitAnswer(@Body() submitAnswerDto: SubmitAnswerDto): Promise<AnswerResponseDto> {
    return this.answerService.submitAnswer(submitAnswerDto);
  }

  @Get()
  async findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.answerService.findByUser(userId);
    }
    return this.answerService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.answerService.findOne(+id);
  }

  @Get('question/:questionId')
  async findByQuestion(@Param('questionId') questionId: string) {
    return this.answerService.findByQuestion(+questionId);
  }

  @Get('questionnaire/:questionnaireId')
  async findByQuestionnaire(@Param('questionnaireId') questionnaireId: string) {
    return this.answerService.findByQuestionnaire(+questionnaireId);
  }
}
