import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { FileController } from './file.controller';
import { File, FileSchema } from './file.schema';
import { FileService } from './file.service';
import { MONGO_CONNECTION_NAME } from '../utils/constants';
import { fileConfig } from '../../config';

@Module({
  imports: [
    ConfigModule.forFeature(fileConfig),
    MongooseModule.forFeature(
      [{ name: File.name, schema: FileSchema }],
      MONGO_CONNECTION_NAME,
    ),
    MulterModule.registerAsync({
      imports: [FileModule],
      useFactory: async (
        fileService: FileService,
        configService: ConfigService,
      ) => {
        const maxFileSize = configService.get<number>('file.maxFileSize');
        return {
          storage: fileService,
          limits: { fileSize: maxFileSize },
        };
      },
      inject: [FileService, ConfigService],
    }),
  ],
  exports: [FileService],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
