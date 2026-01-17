import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { UserStatus } from '../../../../database/entities/user.entity';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class FilterAdminUsersDto extends PaginationQueryDto {
  @ApiProperty({ required: false, description: 'Filter by email (partial match)' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false, description: 'Filter by phone number (partial match)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, enum: UserStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
