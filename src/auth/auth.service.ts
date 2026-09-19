import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const {
      name,
      email,
      mobile,
      password,
      profession,
      gender,
      dateOfBirth,
      country,
      state,
      city,
    } = registerDto;

    // Check email
    const existingEmail = await this.usersService.findByEmail(email);

    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check mobile
    const existingMobile = await this.usersService.findByMobile(mobile);

    if (existingMobile) {
      throw new ConflictException('Mobile number already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      profession,
      gender,
      dateOfBirth,
      country,
      state,
      city,
    });

    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profession: user.profession,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        country: user.country,
        state: user.state,
        city: user.city,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { login, password } = loginDto;

    const user = await this.usersService.findByLogin(login);

    if (!user) {
      throw new UnauthorizedException('Invalid email/mobile or password');
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email/mobile or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      mobile: user.mobile,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profession: user.profession,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        country: user.country,
        state: user.state,
        city: user.city,
      },
    };
  }
}