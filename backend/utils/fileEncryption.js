const crypto = require('crypto');

/**
 * File Encryption Utility
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment or generate a warning
 * @returns {Buffer} 32-byte encryption key
 */
function getEncryptionKey() {
    const keyHex = process.env.FILE_ENCRYPTION_KEY;
    
    if (!keyHex) {
        console.warn('WARNING: FILE_ENCRYPTION_KEY not set in environment. Using default key (NOT SECURE FOR PRODUCTION)');
        // Default key for development only - 64 hex chars = 32 bytes
        return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
    }
    
    if (keyHex.length !== 64) {
        throw new Error('FILE_ENCRYPTION_KEY must be 64 hex characters (256 bits)');
    }
    
    return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt a file buffer using AES-256-GCM
 * @param {Buffer} fileBuffer - The file data to encrypt
 * @returns {Object} { encryptedData: Buffer, iv: Buffer, authTag: Buffer }
 */
function encryptFile(fileBuffer) {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });
    
    const encrypted = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Combine encrypted data with auth tag for storage
    const encryptedWithTag = Buffer.concat([encrypted, authTag]);
    
    return {
        encryptedData: encryptedWithTag,
        iv: iv
    };
}

/**
 * Decrypt a file buffer using AES-256-GCM
 * @param {Buffer} encryptedData - The encrypted file data (includes auth tag at end)
 * @param {Buffer} iv - The initialization vector used for encryption
 * @returns {Buffer} The decrypted file data
 */
function decryptFile(encryptedData, iv) {
    const key = getEncryptionKey();
    
    // Extract auth tag from end of encrypted data
    const authTag = encryptedData.slice(-AUTH_TAG_LENGTH);
    const encrypted = encryptedData.slice(0, -AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });
    
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);
    
    return decrypted;
}

/**
 * Calculate SHA-256 checksum of a file buffer
 * @param {Buffer} fileBuffer - The file data
 * @returns {string} Hex-encoded SHA-256 hash
 */
function calculateChecksum(fileBuffer) {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Verify file integrity by comparing checksums
 * @param {Buffer} fileBuffer - The file data
 * @param {string} expectedChecksum - The expected SHA-256 hash
 * @returns {boolean} True if checksums match
 */
function verifyChecksum(fileBuffer, expectedChecksum) {
    const actualChecksum = calculateChecksum(fileBuffer);
    return actualChecksum === expectedChecksum;
}

/**
 * Generate a new encryption key (for initial setup)
 * @returns {string} 64-character hex string suitable for FILE_ENCRYPTION_KEY
 */
function generateEncryptionKey() {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

module.exports = {
    encryptFile,
    decryptFile,
    calculateChecksum,
    verifyChecksum,
    generateEncryptionKey
};
