import { IsNumber, IsOptional, IsString } from 'class-validator';

export class StartSessionDto {
  @IsNumber()
  questionnaireId: number;

  @IsOptional()
  @IsString()
  userId?: string;
}
