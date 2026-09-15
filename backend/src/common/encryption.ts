const crypto = require('crypto');

const MASTER_KEY = Buffer.from(process.env.MASTER_KEY_HEX!, 'hex'); 

export function encryptApiKey(plaintextKey: string) {
  const iv = crypto.randomBytes(12); 
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintextKey, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}