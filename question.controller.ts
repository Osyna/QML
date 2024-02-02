import { Controller, Post, Body } from '@nestjs/common';
import { QuestionService,QuestionPoolService,QuestionnaireService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuestionPoolDto } from './dto/create-question-pool.dto';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  async create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionService.create(createQuestionDto);
  }
}


@Controller('questionpools')
export class QuestionPoolController {
  constructor(private readonly questionPoolService: QuestionPoolService) {}

  @Post()
  async create(@Body() createQuestionPoolDto: CreateQuestionPoolDto) {
    return this.questionPoolService.create(createQuestionPoolDto);
  }
}


@Controller('questionnaires')
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Post()
  async create(@Body() createQuestionnaireDto: CreateQuestionnaireDto) {
    return this.questionnaireService.create(createQuestionnaireDto);
  }
}

