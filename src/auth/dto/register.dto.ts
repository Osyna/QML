import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { Match } from '../../common/decorators/match.decorator';

export class RegisterDto extends CreateUserDto {
  @ApiProperty({
    description: 'Password confirmation (must match password)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password confirmation is required' })
  @IsString()
  @MinLength(8, { message: 'Password confirmation must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password confirmation must not exceed 128 characters' })
  @Match('password', { message: 'Passwords do not match' })
  passwordConfirmation: string;
}
