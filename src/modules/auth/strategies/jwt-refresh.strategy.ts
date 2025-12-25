import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const header = req.headers['authorization'];
          if (!header) return null;

          const [scheme, token] = header.split(' ');
          if (scheme !== 'Refresh') return null;

          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('app.jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any): Promise<any> {
    const header = req.headers['authorization'];
    const refreshToken = header?.split(' ')[1];
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

    // FIXED: Fetch user WITH refreshToken + expiry
    const user = await this.authService.validateUserWithRefreshToken(payload.sub);
    if (!user) throw new UnauthorizedException('Invalid user');

    // Compare hashed refresh token
    const valid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    if (user.refreshTokenExpires < new Date())
      throw new UnauthorizedException('Refresh token expired');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      token: refreshToken,
    };
  }
}
