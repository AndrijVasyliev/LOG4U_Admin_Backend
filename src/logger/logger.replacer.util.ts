export function replacer(key: string, value: any) {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack?.split('\n'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      cause: value.cause,
    };
  }
  return value;
}
