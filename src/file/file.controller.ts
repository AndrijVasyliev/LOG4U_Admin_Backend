import {
  Controller,
  Get,
  Param,
  Query,
  Body,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CreateFileDto,
  FileQuery,
  FileQuerySearch,
  FileResultDto,
  PaginatedFileResultDto,
} from './file.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { FileService } from './file.service';
import { LoggerService } from '../logger';
import { CreateFileValidation, FileQueryParamsSchema } from './file.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
import { Roles } from '../auth/auth.decorator';

@Controller('file')
@Roles('Admin', 'Super Admin')
export class FileController {
  constructor(
    private readonly log: LoggerService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  async getFiles(
    @Query(new QueryParamsPipe<FileQuerySearch>(FileQueryParamsSchema))
    fileQuery: FileQuery,
  ): Promise<PaginatedFileResultDto> {
    return this.fileService.getFiles(fileQuery);
  }

  @Get(':fileId')
  async getFile(
    @Param('fileId', MongoObjectIdPipe) fileId: string,
  ): Promise<FileResultDto> {
    return this.fileService.findFileById(fileId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createFile(
    @Body(new BodyValidationPipe(CreateFileValidation))
    createFileBodyDto: CreateFileDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FileResultDto> {
    return this.fileService.createFile(createFileBodyDto, file);
  }

  @Delete(':fileId')
  async deleteFile(@Param('fileId', MongoObjectIdPipe) fileId: string) {
    return this.fileService.deleteFile(fileId);
  }
}
