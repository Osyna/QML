import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../common/enums';

export class JwtPayloadDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @IsNumber()
  sub: number;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.STUDENT,
  })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    description: 'Token issued at timestamp',
    example: 1674134400,
  })
  @IsOptional()
  @IsNumber()
  iat?: number;

  @ApiProperty({
    description: 'Token expiration timestamp',
    example: 1674220800,
  })
  @IsOptional()
  @IsNumber()
  exp?: number;
}
