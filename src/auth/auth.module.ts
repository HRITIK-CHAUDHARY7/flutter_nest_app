import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhotoRecord } from '../users/photo-record.entity';
import { PhotosService } from '../users/photos.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([PhotoRecord]),
    JwtModule.register({
      secret: 'my-super-secret-key-change-this',
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PhotosService],
})
export class AuthModule {}