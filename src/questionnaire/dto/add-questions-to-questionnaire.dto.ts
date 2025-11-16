import { IsArray, IsInt, IsNotEmpty, ArrayMinSize, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddQuestionsToQuestionnaireDto {
  @ApiProperty({
    description: 'Array of question IDs to add to the questionnaire',
    example: [1, 2, 3, 4, 5],
    type: [Number],
    minItems: 1,
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one question ID is required' })
  @IsInt({ each: true, message: 'Each question ID must be an integer' })
  @Min(1, { each: true, message: 'Each question ID must be greater than 0' })
  @Type(() => Number)
  questionIds: number[];
}
