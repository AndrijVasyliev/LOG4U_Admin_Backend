import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';

import { FILE_OF_TYPES, MONGO_FILE_BUCKET_NAME } from '../utils/constants';
import { Truck } from '../truck/truck.schema';
import { Person } from '../person/person.schema';
import { Load } from '../load/load.schema';
import { FileOfType } from '../utils/general.dto';

export type FileDocument = File & Document;

@Schema({
  _id: false,
  timestamps: false,
})
export class Metadata {
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    refPath: 'to.toType',
    // Don`t need this as default
    autopopulate: false,
  })
  linkedTo: Truck | Person | Load;

  @Prop({
    required: true,
    type: String,
    enum: FILE_OF_TYPES,
  })
  fileOf: FileOfType;

  @Prop({ required: true, immutable: true })
  contentType: string;

  @Prop({ required: false })
  comment: string;
}

export const MetadataSchema = SchemaFactory.createForClass(Metadata);
MetadataSchema.index({ linkedTo: 1 });
MetadataSchema.index({ fileOf: 1 });

@Schema({
  timestamps: { createdAt: 'uploadDate', updatedAt: false },
  optimisticConcurrency: true,
  collection: `${MONGO_FILE_BUCKET_NAME}.files`,
})
export class File {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  length: number;

  @Prop({
    required: true,
    immutable: true,
    type: MetadataSchema,
  })
  metadata: Metadata;

  uploadDate: Date;

  _id: ObjectId;
}

export const FileSchema = SchemaFactory.createForClass(File);

FileSchema.index({ uploadDate: 1 });
