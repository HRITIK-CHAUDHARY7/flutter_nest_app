import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { Repository } from 'typeorm';
import { PhotoRecord } from './photo-record.entity';

export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class PhotosService {
  readonly uploadDirectory = join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(PhotoRecord)
    private readonly photoRepository: Repository<PhotoRecord>,
  ) {}

  async storeImage(image: UploadedImage): Promise<{
    filename: string;
    mimeType: string;
  }> {
    const extension = allowedTypes[image.mimetype];

        if (!extension) {
          throw new BadRequestException('Use a JPG, PNG, or WebP image');
        }

        if (image.buffer.length > MAX_IMAGE_SIZE_BYTES) {
          throw new BadRequestException('Image must be 20 MB or smaller');
    }

    const filename = `${randomUUID()}${extension}`;
    await mkdir(this.uploadDirectory, { recursive: true });
    await writeFile(join(this.uploadDirectory, filename), image.buffer, {
      flag: 'wx',
    });

    return { filename, mimeType: image.mimetype };
  }

  async createRecord(userId: number, image: UploadedImage) {
    const stored = await this.storeImage(image);

    try {
      const record = this.photoRepository.create({ userId, ...stored });
      const saved = await this.photoRepository.save(record);

      return { id: saved.id, createdAt: saved.createdAt };
    } catch (error) {
      await unlink(join(this.uploadDirectory, stored.filename)).catch(() => {});
      throw error;
    }
  }

  async listForUser(userId: number) {
    const records = await this.photoRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return records.map(({ id, createdAt }) => ({
      id,
      createdAt,
      imageUrl: `/auth/photos/${id}/image`,
    }));
  }

  async getOwnedImage(userId: number, id: number) {
    const record = await this.photoRepository.findOne({ where: { id, userId } });

    if (!record) {
      throw new NotFoundException('Photo not found');
    }

    return {
      filename: record.filename,
      mimeType: record.mimeType,
    };
  }
}