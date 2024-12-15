import {
  Controller,
  Get,
  StreamableFile,
  Res,
  Param,
  Query,
  Body,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Types } from 'mongoose';
import {
  CreateFileDto,
  FileQuery,
  FileResultDto,
  PaginatedFileResultDto,
} from './file.dto';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { FileService } from './file.service';
import { LoggerService } from '../logger';
import {
  CreateFileValidationSchema,
  FileQueryParamsSchema,
} from './file.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { Roles } from '../auth/auth.decorator';
import { MOBILE_PATH_PREFIX } from '../utils/constants';

@Controller(['file', `${MOBILE_PATH_PREFIX}/file`])
@Roles(
  'Admin',
  'Super Admin',
  'Driver',
  'Owner',
  'OwnerDriver',
  'Coordinator',
  'CoordinatorDriver',
)
export class FileController {
  constructor(
    private readonly log: LoggerService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  async getFiles(
    @Query(new QueryParamsSchemaPipe(FileQueryParamsSchema))
    fileQuery: FileQuery,
  ): Promise<PaginatedFileResultDto> {
    return this.fileService.getFiles(fileQuery);
  }

  @Get(':fileId')
  async getFile(
    @Param('fileId', MongoObjectIdPipe) fileId: Types.ObjectId,
  ): Promise<FileResultDto> {
    return this.fileService.findFileById(fileId);
  }

  @Get(':fileId/download')
  async downloadFile(
    @Param('fileId', MongoObjectIdPipe) fileId: Types.ObjectId,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.fileService.getFileStreamById(fileId);
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    return new StreamableFile(file.stream);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createFile(
    @Body(new BodySchemaPipe(CreateFileValidationSchema))
    createFileBodyDto: CreateFileDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FileResultDto> {
    return this.fileService.createFile(createFileBodyDto, file);
  }

  @Delete(':fileId')
  async deleteFile(@Param('fileId', MongoObjectIdPipe) fileId: Types.ObjectId) {
    return this.fileService.deleteFile(fileId);
  }
}
