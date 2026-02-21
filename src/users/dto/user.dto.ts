// src/modules/users/dto/user.dto.ts
// ============================================================
// STRICT DTO VALIDATION: class-validator + class-transformer
// prevent injection attacks and ensure type safety.
// ============================================================
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  IsIn,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    example: 'Str0ng!Pass',
    description: 'Min 8 chars, at least one uppercase, number, and special char',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain uppercase, number, and special character',
  })
  password: string;

  @ApiPropertyOptional({ example: ['user', 'admin'], enum: ['user', 'admin', 'moderator'] })
  @IsOptional()
  @IsArray()
  @IsIn(['user', 'admin', 'moderator'], { each: true })
  roles?: string[];
}

// PartialType makes all fields optional for PATCH requests
export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserResponseDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() fullName: string;
  @Expose() roles: string[];
  @Expose() isActive: boolean;
  @Expose() createdAt: Date;

  // These are excluded from all responses
  @Exclude() password: string;
  @Exclude() refreshToken: string;
}

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number = 10;
}