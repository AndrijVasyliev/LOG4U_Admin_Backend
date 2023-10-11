import { Schema as MongooseSchema, SchemaType } from 'mongoose';

export function DeleteField(schema: MongooseSchema, opts?: any): void {
  schema.pre(['validate'], function (next) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const schema = this.constructor.schema;
    schema.eachPath((pathname: string, schematype: SchemaType) => {
      if (schematype?.options?.ref && schematype?.options?.required === false) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const document = this;
        const value = document.get(pathname);
        if (value === null) {
          document.set(pathname, undefined);
        }
      }
    });
    next();
  });
}
