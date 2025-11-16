import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Role } from '../../common/enums';

class UserPreferencesResponseDto {
  @ApiPropertyOptional({
    description: 'Preferred language code',
    example: 'en',
  })
  language?: string;

  @ApiPropertyOptional({
    description: 'Preferred timezone',
    example: 'America/New_York',
  })
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Notification preferences',
    example: true,
  })
  notifications?: boolean;
}

@Exclude()
export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @Expose()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @Expose()
  lastName: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.STUDENT,
  })
  @Expose()
  role: Role;

  @ApiProperty({
    description: 'User active status',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @Expose()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'User preferences',
    type: () => UserPreferencesResponseDto,
  })
  @Expose()
  @Type(() => UserPreferencesResponseDto)
  preferences?: UserPreferencesResponseDto;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-20T14:45:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Last login timestamp',
    example: '2024-01-20T14:45:00.000Z',
  })
  @Expose()
  lastLoginAt?: Date;

  // Password is excluded by default due to @Exclude() on the class
  // No need to explicitly exclude it here
}
