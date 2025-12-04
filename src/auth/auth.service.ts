
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(employeeId: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmployeeId(employeeId);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { name: user.name, sub: user._id, role: user.role, employeeId: user.employeeId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
