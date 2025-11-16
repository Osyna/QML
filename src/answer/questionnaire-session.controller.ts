import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { QuestionnaireSessionService } from './questionnaire-session.service';
import { StartSessionDto } from './dto/start-session.dto';
import { BatchSubmitAnswersDto } from './dto/batch-submit-answers.dto';

@Controller('sessions')
export class QuestionnaireSessionController {
  constructor(private readonly sessionService: QuestionnaireSessionService) {}

  @Post()
  async startSession(@Body() startSessionDto: StartSessionDto) {
    return this.sessionService.startSession(startSessionDto);
  }

  @Get(':id')
  async getSession(@Param('id') id: string) {
    return this.sessionService.getSession(+id);
  }

  @Post(':id/submit')
  async submitAnswers(
    @Param('id') id: string,
    @Body() batchSubmitDto: BatchSubmitAnswersDto,
  ) {
    // Ensure session ID matches
    batchSubmitDto.sessionId = +id;
    return this.sessionService.submitAnswers(batchSubmitDto);
  }

  @Get(':id/results')
  async getResults(@Param('id') id: string) {
    return this.sessionService.getSessionResults(+id);
  }

  @Get('user/:userId')
  async getUserSessions(@Param('userId') userId: string) {
    return this.sessionService.getUserSessions(userId);
  }

  @Get('questionnaire/:questionnaireId')
  async getQuestionnaireSessions(@Param('questionnaireId') questionnaireId: string) {
    return this.sessionService.getQuestionnaireSessions(+questionnaireId);
  }
}
