import { PaginateResult } from 'mongoose';
import { File } from './file.schema';
import { FileOfType, PaginatedResultDto, Query } from '../utils/general.dto';

export class CreateFileDto {
  readonly linkedTo: string;
  readonly fileOf: FileOfType;
}

export class FileQuerySearch {
  readonly filename?: string;
  readonly truck?: string;
  readonly person?: string;
}

export class FileQuery extends Query<FileQuerySearch> {}

export class FileResultDto {
  static fromFileModel(file: File): FileResultDto {
    return {
      id: file._id.toString(),
      filename: file.filename,
      contentType: file.metadata.contentType,
      contentLength: file.length,
    };
  }

  readonly id: string;
  readonly filename: string;
  readonly contentType: string;
  readonly contentLength: number;
}

export class PaginatedFileResultDto extends PaginatedResultDto<FileResultDto> {
  static from(paginatedFiles: PaginateResult<File>): PaginatedFileResultDto {
    return {
      items: paginatedFiles.docs.map((File) =>
        FileResultDto.fromFileModel(File),
      ),
      offset: paginatedFiles.offset,
      limit: paginatedFiles.limit,
      total: paginatedFiles.totalDocs,
    };
  }
}
