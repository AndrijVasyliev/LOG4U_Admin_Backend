import * as crypto from 'node:crypto';

export const hash = (password: string): string => {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
};
