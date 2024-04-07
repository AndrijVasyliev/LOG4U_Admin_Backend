import {
  connection,
  mongo,
  PaginateModel,
  PaginateOptions,
  Types,
} from 'mongoose';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
  MONGO_UNIQUE_INDEX_CONFLICT,
  UNIQUE_CONSTRAIN_ERROR,
  MONGO_FILE_BUCKET_NAME,
} from '../utils/constants';
import { escapeForRegExp } from '../utils/escapeForRegExp';

const {
  GridFSBucket,
  GridFSBucketWriteStream,
  GridFSBucketReadStream,
  MongoError,
} = mongo;

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
    this.fs = new GridFSBucket(mongoConnection.db, {
      bucketName: MONGO_FILE_BUCKET_NAME,
    });
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

  private async findFileDocumentById(id: string): Promise<FileDocument> {
    this.log.debug(`Searching for File ${id}`);
    const file = await this.fileModel.findOne({ _id: id });
    if (!file) {
      throw new NotFoundException(`File ${id} was not found`);
    }
    this.log.debug(`File ${file._id}`);

    return file;
  }

  async findFileById(id: string): Promise<FileResultDto> {
    const file = await this.findFileDocumentById(id);
    return FileResultDto.fromFileModel(file);
  }

  async getFiles(query: FileQuery): Promise<PaginatedFileResultDto> {
    this.log.debug(`Searching for Files: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.fileModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'search' &&
          entry[0] !== 'truck' &&
          entry[0] !== 'person' &&
          (documentQuery[entry[0]] = {
            $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
          });
      });
    }
    const metadataParts = [];
    if (query?.search?.person) {
      const searchObj: Record<string, any> = {};
      searchObj['metadata.linkedTo'] = { $eq: query?.search?.person };
      searchObj['metadata.fileOf'] = { $eq: 'Person' };
      metadataParts.push(searchObj);
    }
    if (query?.search?.truck) {
      const searchObj: Record<string, any> = {};
      searchObj['metadata.linkedTo'] = { $eq: query?.search?.truck };
      searchObj['metadata.fileOf'] = { $eq: 'Truck' };
      metadataParts.push(searchObj);
    }
    if (metadataParts.length > 1) {
      documentQuery['$or'] = metadataParts;
    } else if (metadataParts.length === 1) {
      Object.assign(documentQuery, metadataParts[0]);
    }
    /*if (query?.search?.search) {
      const search = escapeForRegExp(query?.search?.search);
      documentQuery.$or = [
        { filename: { $regex: new RegExp(search, 'i') } },
      ];
    }*/

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

  async getFileStreamById(fileId: string): Promise<DownloadFileResultDto> {
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
    try {
      this.log.debug(`Creating new File: ${JSON.stringify(createFileDto)}`);
      const fileDocument = await this.findFileDocumentById(file.filename);
      Object.assign(fileDocument.metadata, createFileDto);
      const savedFile = await fileDocument.save();
      return FileResultDto.fromFileModel(savedFile);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      if (e instanceof MongoError && e.code === MONGO_UNIQUE_INDEX_CONFLICT) {
        throw new ConflictException({ type: UNIQUE_CONSTRAIN_ERROR, e });
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async deleteFile(id: string): Promise<FileResultDto> {
    const file = await this.findFileDocumentById(id);

    this.log.debug(`Deleting File ${file._id}`);

    try {
      await this.fs.delete(new Types.ObjectId(file.id));
      this.log.debug('File deleted');
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
    return FileResultDto.fromFileModel(file);
  }
}
