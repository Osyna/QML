import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { QuestionPoolService } from './question-pool.service';
import { CreateQuestionPoolDto } from './dto/create-question-pool.dto';
import { UpdateQuestionPoolDto } from './dto/update-question-pool.dto';

@Controller('question-pools')
export class QuestionPoolController {
  constructor(private readonly questionPoolService: QuestionPoolService) {}

  @Post()
  create(@Body() createQuestionPoolDto: CreateQuestionPoolDto) {
    return this.questionPoolService.create(createQuestionPoolDto);
  }

  @Get()
  findAll(@Query('category') category?: string) {
    if (category) {
      return this.questionPoolService.findByCategory(category);
    }
    return this.questionPoolService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionPoolService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuestionPoolDto: UpdateQuestionPoolDto) {
    return this.questionPoolService.update(+id, updateQuestionPoolDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionPoolService.remove(+id);
  }

  @Post(':id/questions')
  addQuestions(@Param('id') id: string, @Body() body: { questionIds: number[] }) {
    return this.questionPoolService.addQuestions(+id, body.questionIds);
  }

  @Delete(':id/questions')
  removeQuestions(@Param('id') id: string, @Body() body: { questionIds: number[] }) {
    return this.questionPoolService.removeQuestions(+id, body.questionIds);
  }
}
