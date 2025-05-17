import crypto from 'crypto';

/**
 * Utility functions for encrypting and decrypting sensitive data like OAuth tokens
 */

// Use environment variable or fallback to a default (should be set in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'defaultKeyForDevOnlyChangeInProduction';
const IV_LENGTH = 16; // For AES, this is always 16 bytes

/**
 * Encrypts a string using AES-256-CBC
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:encryptedData (both hex encoded)
 */
export function encrypt(text: string): string {
  // Generate a random initialization vector
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher using the encryption key and iv
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), // Ensure key is 32 bytes
    iv
  );
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return iv + encrypted data as a combined string
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts a string that was encrypted with the encrypt function
 * @param text - Encrypted text in format: iv:encryptedData
 * @returns Original decrypted string
 */
export function decrypt(text: string): string {
  try {
    // Split the iv and encrypted text
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift() || '', 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), // Ensure key is 32 bytes
      iv
    );
    
    // Decrypt the text
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Error decrypting data:', error);
    return '';
  }
} 