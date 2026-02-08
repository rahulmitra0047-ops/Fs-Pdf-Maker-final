import { db } from './db';

/**
 * Generates a new serial ID in the format FS_XXXXX (e.g., FS_00001).
 * It checks the 'documents' table for the highest existing ID to auto-increment.
 */
export const generateSerialId = async (): Promise<string> => {
  const lastDoc = await db.documents.orderBy('id').last();
  
  if (!lastDoc) {
    return 'FS_00001';
  }

  const lastId = lastDoc.id;
  // Extract the number part: FS_00123 -> 123
  const parts = lastId.split('_');
  if (parts.length !== 2) {
    // Fallback if format is weird
    return `FS_${Date.now().toString().slice(-5)}`; 
  }

  const currentNum = parseInt(parts[1], 10);
  if (isNaN(currentNum)) {
    return 'FS_00001';
  }

  const nextNum = currentNum + 1;
  // Pad with zeros to ensure 5 digits
  const paddedNum = nextNum.toString().padStart(5, '0');
  
  return `FS_${paddedNum}`;
};

export const generateUUID = (): string => {
  return crypto.randomUUID();
};
