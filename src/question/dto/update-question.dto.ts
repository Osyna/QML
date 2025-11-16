import { PartialType } from '@nestjs/swagger';
import { CreateQuestionDto } from './create-question.dto';

/**
 * DTO for updating an existing Question
 * All fields from CreateQuestionDto are optional for partial updates
 */
export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}
