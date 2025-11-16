import { PartialType } from '@nestjs/swagger';
import { CreateQuestionPoolDto } from './create-question-pool.dto';

export class UpdateQuestionPoolDto extends PartialType(CreateQuestionPoolDto) {}
