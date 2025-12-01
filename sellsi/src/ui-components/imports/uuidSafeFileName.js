import { v4 as uuidv4 } from 'uuid';

export function buildSafeFileNameFromUrl(url) {
  return uuidv4();
}
