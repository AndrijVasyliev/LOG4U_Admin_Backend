import { Readable } from 'node:stream';
import { PaginateResult, Types } from 'mongoose';
import { File } from './file.schema';
import { FileOfType, PaginatedResultDto, Query } from '../utils/general.dto';

/*export type FileParentRef = {
  readonly linkedTo: string;
  readonly fileOf: FileOfType;
};*/

export interface CreateFileDto {
  readonly linkedTo: Types.ObjectId;
  readonly fileOf: FileOfType;
  readonly comment?: string;
  readonly tags?: Map<string, string>;
}

export interface FileQuerySearch {
  // readonly search?: string;
  readonly filename?: string;
  readonly comment?: string;
  readonly linkedTo: Types.ObjectId;
  readonly fileOf: FileOfType;
  readonly tags?: Map<string, string>;
}

export interface FileQueryOrder extends Pick<FileQuerySearch, 'filename'> {
  readonly createdAt?: Date;
}

export interface FileQuery extends Query<FileQuerySearch, FileQueryOrder> {}

export class FileResultDto {
  static fromFileModel(file: File): FileResultDto {
    return {
      id: file._id,
      filename: file.filename,
      contentType: file.metadata.contentType,
      contentLength: file.length,
      comment: file.metadata.comment,
      tags:
        file.metadata.tags && Object.fromEntries(file.metadata.tags.entries()),
    };
  }

  readonly id: Types.ObjectId;
  readonly filename: string;
  readonly contentType: string;
  readonly contentLength: number;
  readonly comment?: string;
  readonly tags?: Record<string, string>;
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
