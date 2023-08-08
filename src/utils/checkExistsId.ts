import { Schema as MongooseSchema } from 'mongoose';
export const checkExistIds = function checkExistIds(schema: MongooseSchema) {
  schema.statics.checkExistIds = async function (ids) {
    const findQuery = {
      _id: {
        $in: ids,
      },
    };

    const selectQuery = '_id';

    const foundIds = await this.find(findQuery, selectQuery).lean();
// @ts-ignore
    const notExistedIds = ids.filter((id) =>
      // @ts-ignore
      foundIds.every((foundId) => {
        const foundIdString = foundId._id.toString();
        const idString = id.toString();
        const result = foundIdString !== idString;
        return result;
      }),
    );

    return notExistedIds.length === 0;
  };
};
