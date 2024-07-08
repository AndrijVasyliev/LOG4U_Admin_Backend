import { Readable } from 'node:stream';
import { PaginateResult } from 'mongoose';
import { File } from './file.schema';
import { FileOfType, PaginatedResultDto, Query } from '../utils/general.dto';

export type FileParentRef = {
  readonly linkedTo: string;
  readonly fileOf: FileOfType;
};

export class CreateFileDto {
  readonly linkedTo: string;
  readonly fileOf: FileOfType;
  readonly comment?: string;
}

export class FileQuerySearch {
  readonly filename?: string;
  readonly comment?: string;
  readonly truck?: string;
  readonly person?: string;
  readonly load?: string;
}

export class FileQuery extends Query<FileQuerySearch> {}

export class FileResultDto {
  static fromFileModel(file: File): FileResultDto {
    return {
      id: file._id.toString(),
      filename: file.filename,
      contentType: file.metadata.contentType,
      contentLength: file.length,
      comment: file.metadata.comment,
    };
  }

  readonly id: string;
  readonly filename: string;
  readonly contentType: string;
  readonly contentLength: number;
  readonly comment?: string;
}

export class DownloadFileResultDto extends FileResultDto {
  static fromFileModelAndStream(
    file: File,
    stream: Readable,
  ): DownloadFileResultDto {
    const fileDto = super.fromFileModel(file);
    return {
      ...fileDto,
      stream,
    };
  }

  readonly stream: Readable;
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
