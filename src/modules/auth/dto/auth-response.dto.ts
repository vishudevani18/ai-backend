import { ApiProperty } from '@nestjs/swagger';
import { ProfileDto } from './profile.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token for authenticated requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for generating new access tokens',
    example: 'eyJhRefreshToken...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Access token expiry time (in seconds)',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'User profile details',
    type: ProfileDto,
  })
  user: ProfileDto;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
