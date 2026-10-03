import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest } from './jwt-auth.guard';
import { MAX_IMAGE_SIZE_BYTES, PhotosService } from '../users/photos.service';
import type { UploadedImage } from '../users/photos.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly photosService: PhotosService,
  ) {}

  @UseInterceptors(FileInterceptor('profilePhoto', { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }))
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() profilePhoto?: UploadedImage,
  ) {
    const storedPhoto = profilePhoto
      ? await this.photosService.storeImage(profilePhoto)
      : undefined;

    return this.authService.register(registerDto, storedPhoto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  currentUser(@Req() request: AuthenticatedRequest) {
    return this.authService.getCurrentUser(request.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/profile-photo')
  async profilePhoto(@Req() request: AuthenticatedRequest) {
    const photo = await this.authService.getProfilePhoto(request.userId);

    return new StreamableFile(
      createReadStream(join(this.photosService.uploadDirectory, photo.filename)),
      { type: photo.mimeType, disposition: 'inline' },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/profile-photo')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }))
  async updateProfilePhoto(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() photo?: UploadedImage,
  ) {
    if (!photo) throw new BadRequestException('Photo is required');
    const stored = await this.photosService.storeImage(photo);

    return this.authService.updateProfilePhoto(request.userId, stored);
  }

  @UseGuards(JwtAuthGuard)
  @Get('photos')
  listPhotos(@Req() request: AuthenticatedRequest) {
    return this.photosService.listForUser(request.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('photos')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }))
  createPhoto(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() photo?: UploadedImage,
  ) {
    if (!photo) throw new BadRequestException('Photo is required');

    return this.photosService.createRecord(request.userId, photo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('photos/:id/image')
  async photoImage(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const photo = await this.photosService.getOwnedImage(request.userId, id);

    return new StreamableFile(
      createReadStream(join(this.photosService.uploadDirectory, photo.filename)),
      { type: photo.mimeType, disposition: 'inline' },
    );
  }
}