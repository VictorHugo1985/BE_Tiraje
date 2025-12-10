
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config'; // Import ConfigService

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) { // Inject ConfigService
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set. Please set it for proper JWT authentication.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // El payload es el objeto que firmamos en el auth.service
    // NestJS lo adjuntará al objeto request.user
    return { userId: payload.sub, name: payload.name, role: payload.role, employeeId: payload.employeeId };
  }
}
