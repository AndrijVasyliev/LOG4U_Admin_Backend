import {
  connection,
  mongo,
  PaginateModel,
  PaginateOptions,
  Types,
} from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { File, FileDocument } from './file.schema';
import {
  CreateFileDto,
  DownloadFileResultDto,
  FileQuery,
  FileResultDto,
  PaginatedFileResultDto,
} from './file.dto';
import { LoggerService } from '../logger';
import {
  MONGO_CONNECTION_NAME,
  MONGO_FILE_BUCKET_NAME,
} from '../utils/constants';
import { escapeForRegExp } from '../utils/escapeForRegExp';

const { GridFSBucket, GridFSBucketWriteStream, GridFSBucketReadStream } = mongo;

@Injectable()
export class FileService {
  private readonly fs: InstanceType<typeof GridFSBucket>;
  constructor(
    @InjectModel(File.name, MONGO_CONNECTION_NAME)
    private readonly fileModel: PaginateModel<FileDocument>,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
    @InjectConnection(MONGO_CONNECTION_NAME)
    private mongoConnection: typeof connection,
  ) {
    if (mongoConnection.db) {
      this.fs = new GridFSBucket(mongoConnection.db, {
        bucketName: MONGO_FILE_BUCKET_NAME,
      });
    }
  }

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, params?: Record<string, any>) => void,
  ) {
    this.log.debug(`Creating new File: ${file.originalname}`);
    try {
      const ws: InstanceType<typeof GridFSBucketWriteStream> =
        this.fs.openUploadStream(file.originalname, {
          metadata: { contentType: file.mimetype },
        });
      this.log.debug(`File is created: ${ws.id.toString()}`);
      file.stream.pipe(ws);
      ws.on('error', cb);
      ws.on('finish', () => cb(null, { filename: ws.id.toString() }));
    } catch (error) {
      cb(error as Error);
    }
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void,
  ) {
    this.log.debug(`Deleting File: ${file.filename || file.originalname}`);
    try {
      if (file.filename) {
        this.fs.delete(new Types.ObjectId(file.filename)).then(
          () => cb(null),
          (error: Error) => cb(error),
        );
      }
      cb(null);
    } catch (error) {
      cb(error as Error);
    }
  }

  private async findFileDocumentById(
    id: Types.ObjectId,
  ): Promise<FileDocument> {
    this.log.debug(`Searching for File ${id}`);
    const file = await this.fileModel.findOne({ _id: id });
    if (!file) {
      throw new NotFoundException(`File ${id} was not found`);
    }
    this.log.debug(`File ${file._id}`);

    return file;
  }

  async findFileById(id: Types.ObjectId): Promise<FileResultDto> {
    const file = await this.findFileDocumentById(id);
    // const temp = await file.populate('metadata.linkedTo');
    return FileResultDto.fromFileModel(file);
  }

  async getFiles(query: FileQuery): Promise<PaginatedFileResultDto> {
    this.log.debug(`Searching for Files: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.fileModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'search' &&
          entry[0] !== 'linkedTo' &&
          entry[0] !== 'fileOf' &&
          entry[0] !== 'tags' &&
          entry[0] !== 'comment' &&
          (documentQuery[entry[0]] = {
            $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
          });
      });
    }
    if (query?.search?.comment) {
      documentQuery['metadata.comment'] = {
        $regex: new RegExp(escapeForRegExp(query.search.comment), 'i'),
      };
    }
    if (query?.search?.linkedTo && query?.search?.fileOf) {
      documentQuery['metadata.linkedTo'] = { $eq: query.search.linkedTo };
      documentQuery['metadata.fileOf'] = { $eq: query.search.fileOf };
    }
    if (query?.search?.tags) {
      const tags: Record<string, any>[] = [];
      query.search.tags.forEach((tagValue, tagKey) => {
        tags.push({ [`metadata.tags.${tagKey}`]: { $eq: tagValue } });
      });
      if (tags.length > 1) {
        documentQuery['$or'] = tags;
      } else if (tags.length === 1) {
        Object.assign(documentQuery, tags[0]);
      }
    }

    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
    };
    if (query.direction && query.orderby) {
      let newOrder: string;
      switch (query.orderby) {
        case 'createdAt':
          newOrder = 'uploadDate';
          break;
        default:
          newOrder = query.orderby;
      }
      options.sort = { [newOrder]: query.direction };
    }

    const res = await this.fileModel.paginate(documentQuery, options);

    return PaginatedFileResultDto.from(res);
  }

  async getFileStreamById(
    fileId: Types.ObjectId,
  ): Promise<DownloadFileResultDto> {
    this.log.debug(`Getting file stream by id: ${fileId}`);
    const fileDocument = await this.findFileDocumentById(fileId);
    const fileStream: InstanceType<typeof GridFSBucketReadStream> =
      this.fs.openDownloadStream(new Types.ObjectId(fileId));
    return DownloadFileResultDto.fromFileModelAndStream(
      fileDocument,
      fileStream,
    );
  }

  async createFile(
    createFileDto: CreateFileDto,
    file: Express.Multer.File,
  ): Promise<FileResultDto> {
    this.log.debug(`Creating new File: ${JSON.stringify(createFileDto)}`);

    const fileDocument = await this.findFileDocumentById(
      new Types.ObjectId(file.filename),
    );
    Object.assign(fileDocument.metadata, createFileDto);
    const savedFile = await fileDocument.save();

    return FileResultDto.fromFileModel(savedFile);
  }

  async deleteFile(id: Types.ObjectId): Promise<FileResultDto> {
    const file = await this.findFileDocumentById(id);

    this.log.debug(`Deleting File ${file._id}`);

    await this.fs.delete(new Types.ObjectId(file.id));
    this.log.debug('File deleted');

    return FileResultDto.fromFileModel(file);
  }
}
