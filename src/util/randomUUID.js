import { v4 as uuidv4 } from 'uuid';

export function generateUUID() {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, "_");
  return uuidv4().replace(/-/g, "_");
}
