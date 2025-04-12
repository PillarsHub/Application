import { v4 as uuidv4 } from 'uuid';

export function generateUUID() {
  try {
    return crypto.randomUUID().replace(/-/g, '_');
  } catch (e) {
    return uuidv4().replace(/-/g, '_');
  }
}
