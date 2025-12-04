
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // passport-local por defecto usa 'username' y 'password'
    // Lo configuramos para que use 'employeeId'
    super({ usernameField: 'employeeId' });
  }

  async validate(employeeId: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(employeeId, password);
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }
    return user;
  }
}
