
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config'; // Import ConfigService

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) { // Inject ConfigService
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'), // Get secret from ConfigService
    });
  }

  async validate(payload: any) {
    // El payload es el objeto que firmamos en el auth.service
    // NestJS lo adjuntará al objeto request.user
    return { userId: payload.sub, name: payload.name, role: payload.role, employeeId: payload.employeeId };
  }
}
